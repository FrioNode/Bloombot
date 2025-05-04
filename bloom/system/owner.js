const { sudoChat, bloom } = require('../../colors/setup');
const mess = require('../../colors/mess');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

const isOwner = (sender, message) => {
    if (sender.endsWith('@g.us')) {
        return message.key.participant === sudoChat;
    }
    return sender === sudoChat;
};

module.exports = {
    reboot: {
        type: 'owner',
        desc: 'Reboots the bot.',
        run: async (Bloom, message, fulltext) => {
            const sender = message.key.remoteJid;

            if (!isOwner(sender, message)) {
                return await Bloom.sendMessage(sender, { text: mess.norestart }, { quoted: message });
            }

            try {
                await Bloom.sendMessage(sender, { text: mess.restarting }, { quoted: message });
                await execPromise(bloom.scripts.restart);
            } catch (err) {
                console.error('Reboot error:', err);
                await Bloom.sendMessage(sender, { text: `❌ Failed to reboot the bot: ${err.message}` }, { quoted: message });
            }
        }
    },
    stop: {
        type: 'owner',
        desc: 'Stops the bot.',
        run: async (Bloom, message, fulltext) => {
            const sender = message.key.remoteJid;

            if (!isOwner(sender, message)) {
                return await Bloom.sendMessage(sender, { text: mess.norestart }, { quoted: message });
            }

            try {
                // Stopping bot (PM2 process)
                await Bloom.sendMessage(sender, { text: '🛑 Bot has been stopped.' }, { quoted: message });
                await execPromise(bloom.scripts.stop);
            } catch (err) {
                console.error('Stop error:', err);
                await Bloom.sendMessage(sender, { text: `❌ Failed to stop the bot: ${err.message}` }, { quoted: message });
            }
        }
    },
        $: {
            type: 'owner',
            desc: 'Executes a shell command (owner only)',
            run: async (Bloom, message, fulltext) => {
                const sender = message.key.remoteJid;

                if (!isOwner(sender, message)) {
                    return await Bloom.sendMessage(sender, { text: mess.owner || '❌ Unauthorized access.' }, { quoted: message });
                }

                const command = fulltext.trim().split(' ').slice(1).join(' '); // remove "$" from fulltext

                if (!command) {
                    return await Bloom.sendMessage(sender, { text: '📎 Please provide a shell command to execute.' }, { quoted: message });
                }

                try {
                    const { stdout, stderr } = await execPromise(command);

                    if (stderr) {
                        return await Bloom.sendMessage(sender, {
                            text: `❌ stderr:\n\`\`\`\n${stderr}\n\`\`\``
                        }, { quoted: message });
                    }

                    const output = stdout.length > 3000
                    ? stdout.slice(0, 3000) + '\n... (output truncated)'
                    : stdout;

                    await Bloom.sendMessage(sender, {
                        text: `✅ Output:\n\`\`\`\n${output}\n\`\`\``
                    }, { quoted: message });

                } catch (err) {
                    await Bloom.sendMessage(sender, {
                        text: `❌ Error:\n\`\`\`\n${err.message}\n\`\`\``
                    }, { quoted: message });
                }
            }
        }

};