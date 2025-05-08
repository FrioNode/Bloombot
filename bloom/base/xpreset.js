const { Exp } = require('../../colors/schema');
const { sudochat } = require('../../colors/setup');
module.exports = {
    xpreset: {
        run: async (Bloom, message, fulltext) => {
            const sender = message.key.participant || message.key.remoteJid;
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
    }
};