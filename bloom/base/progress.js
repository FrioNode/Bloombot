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

function getLevel(points) {
    let current = LEVELS[0], next = null;
    for (let i = 1; i < LEVELS.length; i++) {
        if (points >= LEVELS[i].min) {
            current = LEVELS[i];
        } else {
            next = LEVELS[i];
            break;
        }
    }
    return { current, next };
}

function createProgressBar(percentage, barLength = 10) {
    const filled = Math.round((percentage / 100) * barLength);
    const empty = barLength - filled;
    return `[${'█'.repeat(filled)}${'-'.repeat(empty)}]`;
}

module.exports = {
    progress: {
        run: async (Bloom, message) => {
            const jid = message.key?.participant || message.key?.remoteJid;
            const expData = await Exp.findOne({ jid });
            if (!expData) {
                return await Bloom.sendMessage(message.key.remoteJid, {
                    text: "You don't have any EXP yet. Start using commands to earn some!"
                });
            }

            const { points } = expData;
            const { current, next } = getLevel(points);

            if (!next) {
                return await Bloom.sendMessage(message.key.remoteJid, {
                    text: `╭───────────────\n│ 🏆 You are at the highest level: *${current.name}*\n╰───────────────`
                });
            }

            const range = next.min - current.min;
            const gained = points - current.min;
            const percentage = Math.floor((gained / range) * 100);
            const bar = createProgressBar(percentage);

            const msg =
`╭───────────────
│ 🎖️ Level: *${current.name}*
│ 🔋 Progress: ${bar} ${percentage}%
│ ⬆️ *${next.name}* unlocks at *${next.min}* points
╰───────────────`;

            await Bloom.sendMessage(message.key.remoteJid, { text: msg });
        },
        type: 'user',
        desc: 'Shows your EXP progress bar'
    }
};