const luna = require('../../package.json');
const { get, set, connectDB } = require('../../colors/setup');
const { isBloomKing } = require('../../colors/auth');
const { mess } = require('../../colors/mess');
const { Exp } = require('../../colors/schema');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const fs = require('fs');
const path = require('path');
// ------FRIONODE-----

const isOwner =isBloomKing;
    module.exports = {
        join: {
            type: 'owner',
            desc: 'Make bot join a group',
            usage: 'join <group_link> or <code>',
            run: async (Bloom, message, fulltext) => {
                const remoteJid = message.key.remoteJid;
                const sender = message.key.participant || remoteJid;
                if (!isBloomKing(sender,message)) {
                    return await Bloom.sendMessage(remoteJid, { text: '❌ This command is for the bot owner only.' }, { quoted: message });
                }

                const input = fulltext.split(' ').slice(1).join(' ').trim();
                if (!input) {
                    return await Bloom.sendMessage(remoteJid, { text: '❌ Please provide a group invite link or code.' }, { quoted: message });
                }

                // Match link or code
                const match = input.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/) || input.match(/^([a-zA-Z0-9]{20,})$/);
                if (!match) {
                    return await Bloom.sendMessage(remoteJid, { text: '❌ Invalid link or code. Please check and try again.' }, { quoted: message });
                }

                const code = match[1];

                try {
                    const groupInfo = await Bloom.groupAcceptInvite(code);
console.log('groupInfo:', groupInfo);

let groupName = 'Unnamed Group';
try {
    // groupInfo might be a string (jid) or an object with .id
    const groupJid = typeof groupInfo === 'string' ? groupInfo : groupInfo.id;
    const meta = await Bloom.groupMetadata(groupJid);
    groupName = meta.subject || groupName;
   // console.log('groupMetadata:', meta);
} catch (e) {
    console.error('Failed to fetch group metadata:', e);
}

return await Bloom.sendMessage(remoteJid, {
    text: `✅ Successfully joined group:\n${groupName}`
}, { quoted: message });
                } catch (err) {
                    let reason = '❌ Failed to join group.';

                    if (err?.output?.statusCode === 500 && err?.message?.toLowerCase().includes('conflict')) {
                        reason = '⚠️ Bot is already a member of that group.';
                    } else if (err?.message?.toLowerCase().includes('not-authorized')) {
                        reason = '❌ Link may be revoked or invalid.';
                    }

                    console.error('Group Join Error:', err);
                    await Bloom.sendMessage(remoteJid, { text: reason }, { quoted: message });
                }
            }
    },
    bc: {
        type: 'utility',
        desc: 'Send broadcast to all participating groups',
        usage: 'bc <message>',
        run: async (Bloom, message, fulltext) => {
            // console.log('Bloom object keys:', Object.keys(Bloom));
            const sender = message.key.remoteJid;
            const senderid = message.key.participant;

            console.log(sender, senderid);
            if (!isBloomKing(sender, message)) {
                return await Bloom.sendMessage(sender, { text: mess.owner }, { quoted: message });
            }
            console.log(message.pushName);
            try {
                const args = fulltext.trim().split(' ');
                if (args.length < 2) {
                    return await Bloom.sendMessage(message.key.remoteJid, { text: 'Usage: bc <message>' });
                }
                const bcmess = args.slice(1).join(' ');
                const groups = await Bloom.groupFetchAllParticipating();
                if (!groups || Object.keys(groups).length === 0) {
                    return await Bloom.sendMessage(message.key.remoteJid, { text: 'You are not in any group... Join / Create groups to broadcast' });
                }

                for (const groupId of Object.keys(groups)) {
                    await Bloom.sendMessage(groupId, { text: `_Incomming Broadcast From_ *${message.pushName}* \n${bcmess}` });
                }

                await Bloom.sendMessage(message.key.remoteJid, { text: '✅ Broadcast sent to all groups.' });
            } catch (error) {
                console.error('Broadcast command error:', error);
                await Bloom.sendMessage(message.key.remoteJid, { text: '❌ Failed to send broadcast...' });
            }
        }
    },
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
                await execPromise(luna.scripts.restart);
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
                await execPromise(luna.scripts.stop);
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
        xpreset: {
            run: async (Bloom, message, fulltext) => {
                const sender = message.key.participant || message.key.remoteJid;
                const sudochat = (await get('OWNERNUMBER')) + '@s.whatsapp.net';
                if (sender !== sudochat) {
                    return await Bloom.sendMessage(message.key.remoteJid, {
                        text: "🚫 Only the bot owner can reset EXP."
                    });
                }
                const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.participant;
                if (!mentionedJid) {
                    return await Bloom.sendMessage(message.key.remoteJid, {
                        text: "❓ Please mention the user whose EXP you want to reset."
                    });
                }

                const result = await Exp.findOneAndUpdate(
                    { jid: mentionedJid },
                    {
                        $set: {
                            points: 0,
                            messageCount: 0,
                            streak: 0,
                            lastDaily: null
                        }
                    },
                    { new: true }
                );

                if (!result) {
                    return await Bloom.sendMessage(message.key.remoteJid, {
                        text: "⚠️ No EXP data found for that user."
                    });
                }

                await Bloom.sendMessage(message.key.remoteJid, {
                    text: `🔄 EXP for @${mentionedJid.split('@')[0]} has been reset.`,
                                        mentions: [mentionedJid]
                });
            },
            type: 'owner',
            desc: 'Reset a user’s EXP (admin only)'
        },
        set: {
    type: 'owner',
    desc: 'Set config variables in MongoDB setup (Owner only)',
    usage: 'set <key> <value>',
    async run(Bloom, message, fulltext) {
        const sender = message.key.participant || message.key.remoteJid;
        const replypath = message.key.remoteJid
        const [argRaw, ...rest] = fulltext.split(' ').slice(1);
        const value = rest.join(' ');
        const arg = argRaw?.toUpperCase(); // <-- convert only the argument to uppercase

        if (!isBloomKing(sender, message)){
            return await Bloom.sendMessage(message.key.remoteJid, {
                text: mess.owner
            }, { quoted: message });
        }

        if (!arg || !value) {
            return await Bloom.sendMessage(message.key.remoteJid, {
                text: 'Usage: set <key> <value>'
            }, { quoted: message });
        }

        try {
            // Convert value to proper type (boolean or number)
            const typedValue = isNaN(value)
                ? (value === 'true' ? true : value === 'false' ? false : value)
                : Number(value);

            // Use MongoDB setup module
            await set(arg, typedValue);

            await Bloom.sendMessage(replypath, {
                text: `✅ Config updated!\n"${arg}" = ${typedValue}`
            }, { quoted: message });

        } catch (error) {
            console.error('Config update failed:', error);
            await Bloom.sendMessage(message.key.remoteJid, {
                text: `❌ Failed to update config: ${error.message}`
            }, { quoted: message });
        }
    }
},
get: {
    type: 'owner',
    desc: 'Get config values from MongoDB (all or specific key)',
    usage: 'get [key]',
    run: async (Bloom, message, fulltext) => {
        const sender = message.key.participant || message.key.remoteJid;
        const replyPath = message.key.remoteJid;

        // Only owner
        if (!isBloomKing(sender, message)) {
            return await Bloom.sendMessage(replyPath, { text: '❌ This command is for the bot owner only.' }, { quoted: message });
        }

        const args = fulltext.trim().split(' ').slice(1);
        const key = args[0]?.toUpperCase();

        try {
            if (key) {
                // Single key
                const value = await get(key);
                return await Bloom.sendMessage(replyPath, { text: `• ${key} = ${value || '❌ Not found'}` }, { quoted: message });
            } else {
                // All keys
                const Setting = await connectDB();
                const docs = await Setting.find({}); // fetch all
                if (!docs.length) return await Bloom.sendMessage(replyPath, { text: '⚠️ No config keys found.' }, { quoted: message });

                const allKeysText = docs.map(d => `• ${d._id} = ${d.value}`).join('\n');
                return await Bloom.sendMessage(replyPath, { text: `📋 Config values:\n${allKeysText}` }, { quoted: message });
            }
        } catch (err) {
            console.error('Get command error:', err);
            return await Bloom.sendMessage(replyPath, { text: `❌ Failed to fetch config: ${err.message}` }, { quoted: message });
        }
    }
}
};