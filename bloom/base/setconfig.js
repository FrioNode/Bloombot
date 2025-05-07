const fs = require('fs');
const path = require('path');
const { sudoChat, _reload } = require('../../colors/setup'); _reload();
const mess = require('../../colors/mess');

const configPath = path.join(__dirname, '../../colors/config.json');

module.exports = {
    set: {
        type: 'owner',
        desc: 'Set config variables in config.json (Owner only)',
        usage: 'set <key> <value>',
        async run(Bloom, message, fulltext) {
            const sender = message.key.participant || message.key.remoteJid;
            const [arg, ...rest] = fulltext.split(' ').slice(1);
            const value = rest.join(' ');

            if (sender !== sudoChat) {
                return await Bloom.sendMessage(message.key.remoteJid, {
                    text: mess.owner
                }, { quoted: message });
            }

            if (!arg || !value) {
                return await Bloom.sendMessage(sender, {
                    text: 'Usage: set <key> <value>'
                }, { quoted: message });
            }

            try {
                const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

                if (!(arg in configData)) {
                    return await Bloom.sendMessage(sender, {
                        text: `❌ Key "${arg}" does not exist in config.json.`
                    }, { quoted: message });
                }

                configData[arg] = isNaN(value)
                ? (value === 'true' ? true : value === 'false' ? false : value)
                : Number(value);

                fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

                // 🔄 Reload setup.js to apply new config immediately
                delete require.cache[require.resolve('../../colors/setup')];
                require('../../colors/setup');

                await Bloom.sendMessage(message.key.remoteJid, {
                    text: `Check DM for results...`
                }, { quoted: message });

                await Bloom.sendMessage(sender, {
                    text: `✅ Config updated.\n"${arg}" is now set to: ${value}\n\nNo need for reboot but you may need to *reload* commands`
                }, { quoted: message });

            } catch (error) {
                console.error('Config update failed:', error);
                await Bloom.sendMessage(message.key.remoteJid, {
                    text: `❌ Failed to update config: ${error.message}`
                }, { quoted: message });
            }
        }
    }
};
