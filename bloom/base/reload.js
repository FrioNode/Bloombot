const path = require('path');
const fs = require('fs');
const { sudochat } = require('../../colors/setup');

module.exports = {
    reload: {
        type: 'owner',
        desc: 'Force reload all commands (Bot admin only)',
        run: async (Bloom, message) => {
            const sender = message.key.participant || message.key.remoteJid;
            // Bot Admin check
            if (sender !== sudochat) {
                return await Bloom.sendMessage(message.key.remoteJid, {
                    text: '❌ This command is restricted to bot admins.'
                });
            }

            try {
                await Bloom.sendMessage(message.key.remoteJid, {
                    text: '🔄 Reloading all commands...'
                });

                // Clear require cache for commands
                const currentDir = path.join(__dirname, '..');
                Object.keys(require.cache).forEach(key => {
                    if (key.startsWith(currentDir) &&
                        !key.includes('reload.js') &&
                        !key.includes('base/reload.js')) {
                        delete require.cache[key];
                        }
                });

                // Reload all commands from all subdirectories
                const commandDirs = fs.readdirSync(currentDir)
                .filter(file => {
                    const fullPath = path.join(currentDir, file);
                    return fs.statSync(fullPath).isDirectory();
                });

                for (const dir of commandDirs) {
                    const dirPath = path.join(currentDir, dir);
                    const commandFiles = fs.readdirSync(dirPath)
                    .filter(file => file.endsWith('.js') && !file.startsWith('_'));

                    for (const file of commandFiles) {
                        require(path.join(dirPath, file));
                    }
                }
                await Bloom.sendMessage(message.key.remoteJid, {
                    text: '✅ All commands reloaded successfully!\n\n' +
                    'ℹ️ Note: Changes take effect immediately!'
                });
            } catch (err) {
                console.error('Reload failed:', err);
                await Bloom.sendMessage(message.key.remoteJid, {
                    text: '❌ Failed to reload commands. Check console.'
                });
            }
        }
    }
};