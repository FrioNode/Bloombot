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
    return { current, next };
}

function msToTime(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
}

module.exports = {
    exp: {
        run: async (Bloom, message) => {
            const jid = message.key?.participant || message.key?.remoteJid;
            const now = new Date();

            let expData = await Exp.findOne({ jid });

            if (!expData) {
                expData = new Exp({ jid, points: 0, streak: 0 });
            }

            let bonusGiven = false;
            if (!expData.lastDaily || now - new Date(expData.lastDaily) > 24 * 60 * 60 * 1000) {
                expData.points += 5; // daily bonus
                expData.lastDaily = now;
                expData.streak = (expData.streak || 0) + 1;
                bonusGiven = true;
            }

            await expData.save();

            const { current, next } = getLevel(expData.points);

            let response = `╭───────📊 EXP REPORT───────\n`;
            response += `│ 🔢 *${expData.points}* points\n`;
            response += `│ 🎖️ Level: *${current.name}*\n`;

            if (next) {
                const needed = next.min - expData.points;
                response += `│ ⬆️ *${needed}* more to *${next.name}*\n`;
            } else {
                response += `│ 🏆 *MAX LEVEL*: ${current.name}\n`;
            }

            if (bonusGiven) {
                response += `│ 🎁 Daily bonus claimed! (+5 EXP)\n`;
                response += `│ 🔥 Streak: *${expData.streak} days*\n`;
            } else {
                const waitTime = 24 * 60 * 60 * 1000 - (now - new Date(expData.lastDaily));
                response += `│ 🕒 Daily bonus in: ${msToTime(waitTime)}\n`;
            }

            response += `╰─────────────────────────`;

            await Bloom.sendMessage(message.key.remoteJid, { text: response });
        },
        type: 'user',
        desc: 'Check your EXP and get daily bonus'
    }
};