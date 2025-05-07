const fs = require('fs');
const path = require('path');
const { sudoChat } = require('../../colors/setup');
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

            // Permission check
            if (sender !== sudoChat) {
                return await Bloom.sendMessage(message.key.remoteJid, {
                    text: mess.owner
                }, { quoted: message });
            }

            // Validate input
            if (!arg || !value) {
                return await Bloom.sendMessage(sender, {
                    text: 'Usage: set <key> <value>'
                }, { quoted: message });
            }

            try {
                // Read and update config
                const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

                if (!(arg in configData)) {
                    return await Bloom.sendMessage(sender, {
                        text: `❌ Key "${arg}" does not exist in config.json.`
                    }, { quoted: message });
                }

                // Type conversion
                configData[arg] = isNaN(value)
                ? (value === 'true' ? true : value === 'false' ? false : value)
                : Number(value);

                // Save config
                fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

                // 🔥 Targeted reload of only base/ and system/ directories
                const reloadPaths = [
                    path.join(__dirname, '../base'),
                    path.join(__dirname, '../system')
                ];

                Object.keys(require.cache).forEach(key => {
                    if (
                        // Only reload files in target directories
                        reloadPaths.some(dir => key.startsWith(dir)) &&
                        // Never reload these files
                        !key.includes('setconfig.js') &&
                        !key.includes('brain.js')
                    ) {
                        delete require.cache[key];
                    }
                });

                // Notify success
                await Bloom.sendMessage(message.key.remoteJid, {
                    text: `✅ Config updated!\n"${arg}" = ${value}\n\nReloaded: base/, system/`
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