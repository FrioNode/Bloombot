const fs = require('fs');
const path = require('path');
const { sudochat } = require('../../colors/setup');
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
            if (sender !== sudochat) {
                return await Bloom.sendMessage(message.key.remoteJid, {
                    text: mess.owner
                }, { quoted: message });
            }

            // Validate input
            if (!arg || !value) {
                return await Bloom.sendMessage(message.key.remoteJid, {
                    text: 'Usage: set <key> <value>'
                }, { quoted: message });
            }

            try {
                // Read and update config
                const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

                if (!(arg in configData)) {
                    return await Bloom.sendMessage(message.key.remoteJid, {
                        text: `❌ Key "${arg}" does not exist in config.json.`
                    }, { quoted: message });
                }

                // Type conversion
                configData[arg] = isNaN(value)
                ? (value === 'true' ? true : value === 'false' ? false : value)
                : Number(value);

                // Save config
                fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

                // 🔥 NEW: Optimized reload logic
                const reloadTargets = [
                    path.join(__dirname, '../base'),
                    path.join(__dirname, '../plugins')
                ];

                // Clear require cache for target files
                Object.keys(require.cache).forEach(key => {
                    if (
                        reloadTargets.some(dir => key.startsWith(dir)) &&
                        !key.includes('setconfig.js')
                    ) {
                        delete require.cache[key];
                    }
                });

                // Notify success
                await Bloom.sendMessage(sender, {
                    text: `✅ Config updated!\n"${arg}" = ${value}\n\nCommands reloaded automatically`
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