const { Exp } = require('../../colors/schema');

const LEVELS = [
    { name: '👶 Baby', min: 0 },
    { name: '🌱 Beginner', min: 10 },
    { name: '🪶 Novice', min: 25 },
    { name: '🏠 Citizen', min: 50 },
    { name: '🛡️ Lord', min: 100 },
    { name: '🎩 Baron', min: 200 },
    { name: '🏛️ Governor', min: 400 },
    { name: '⚔️ Commander', min: 700 },
    { name: '🧠 Master', min: 1000 },
    { name: '🔥 Grandmaster', min: 1500 },
    { name: '🔮 Archmage', min: 2200 },
    { name: '🧙 Wizard', min: 3000 },
];

function getLevelInfo(points) {
    let current = LEVELS[0];
    let next = null;
    for (let i = 1; i < LEVELS.length; i++) {
        if (points >= LEVELS[i].min) {
            current = LEVELS[i];
        } else {
            next = LEVELS[i];
            break;
        }
    }
    return {
        current: current.name,
        next: next ? next.name : 'MAX LEVEL',
        toNext: next ? next.min - points : 0
    };
}

module.exports = {
    level: {
        run: async (Bloom, message, fulltext) => {
            const text = fulltext.trim().split(' ').slice(1).join(' ').trim();

            let targetJid;

            if (message.message?.extendedTextMessage?.contextInfo?.participant) {
                targetJid = message.message.extendedTextMessage.contextInfo.participant;
            } else if (/^\d{8,15}$/.test(text)) {
                targetJid = `${text}@s.whatsapp.net`;
            } else {
                return await Bloom.sendMessage(message.key.remoteJid, {
                    text: "❗ Please tag a user or provide a valid number."
                });
            }

            const exp = await Exp.findOne({ jid: targetJid });

            if (!exp) {
                return await Bloom.sendMessage(message.key.remoteJid, {
                    text: `🙁 That user has no EXP yet.`
                });
            }

            const levelInfo = getLevelInfo(exp.points);

            const reply = `📊 *User:* @${targetJid.split('@')[0]}\n` +
                          `🏅 *Level:* ${levelInfo.current}\n` +
                          `💠 *Points:* ${exp.points} pts\n` +
                          `📈 *To next level:* ${levelInfo.toNext} pts → ${levelInfo.next}`;

            await Bloom.sendMessage(message.key.remoteJid, {
                text: reply,
                mentions: [targetJid]
            });
        },
        type: 'user',
        desc: 'See rank / level of another user',
    },
    rank: {
        run: async (...args) => module.exports.level.run(...args),
        type: 'user',
        desc: 'See rank / level of another user'
    }
};