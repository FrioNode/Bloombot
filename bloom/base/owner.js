const { sudochat, bloom, _reload } = require('../../colors/setup'); _reload();
const mess = require('../../colors/mess');
const { Exp } = require('../../colors/schema');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

const isOwner = (sender, message) => {
    if (sender.endsWith('@g.us')) {
        return message.key.participant === sudochat;
    }
    return sender === sudochat;
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
                    return await Bloom.sendMessage(sender, { text: mess.noarg }, { quoted: message });
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
        },
        setxp: {
            run: async (Bloom, message, fulltext) => {
                const sender = message.key.remoteJid;
                if (!isOwner(sender, message)) {
                    return await Bloom.sendMessage(message.key.remoteJid, { text: mess.owner });
                }

                const quotedJid = message.message?.extendedTextMessage?.contextInfo?.participant;
                const parts = fulltext.split(' ').slice(1);
                let targetJid = null;
                let amount = null;

                if (quotedJid) {
                    // Format: setxp (quoted user) 1234
                    targetJid = quotedJid;
                    amount = parseInt(parts[0]);
                } else if (parts.length === 2 && /^\d+$/.test(parts[0])) {
                    // Format: setxp 254700000000 1234
                    targetJid = parts[0] + "@s.whatsapp.net";
                    amount = parseInt(parts[1]);
                }

                if (!targetJid || isNaN(amount)) {
                    return await Bloom.sendMessage(message.key.remoteJid, {
                        text: `⚠️ Usage:\n*setxp (quote user) 1234*\nor\n*setxp 254700000000 1234*`
                    });
                }

                await Exp.findOneAndUpdate(
                    { jid: targetJid },
                    { $set: { points: amount } },
                    { upsert: true, new: true }
                );

                await Bloom.sendMessage(message.key.remoteJid, {
                    text: `✅ Set EXP of *${targetJid.split('@')[0]}* to *${amount}*`
                });
            },
            type: 'owner',
            desc: 'Set EXP for a user manually',
            usage: '*setxp (quote user) 1234*\nor\n*setxp 254700000000 1234*'
        },


};