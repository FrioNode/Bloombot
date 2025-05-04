const { Exp } = require('../../colors/schema');
const setup = require('../../colors/setup');

module.exports = {
    setxp: {
        run: async (Bloom, message, fulltext) => {
            const sender = message.key.participant || message.key.remoteJid;
            if (sender !== setup.sudoChat) {
                return await Bloom.sendMessage(message.key.remoteJid, { text: "⛔ Bot Admins only." });
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