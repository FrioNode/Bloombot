const { Exp } = require('../../colors/schema');

const LEVELS = [
    { name: 'Baby', min: 0 },
    { name: 'Beginner', min: 10 },
    { name: 'Novice', min: 25 },
    { name: 'Citizen', min: 50 },
    { name: 'Lord', min: 100 },
    { name: 'Baron', min: 200 },
    { name: 'Governor', min: 400 },
    { name: 'Commander', min: 700 },
    { name: 'Master', min: 1000 },
    { name: 'Grandmaster', min: 1500 },
    { name: 'Archmage', min: 2200 },
    { name: 'Wizard', min: 3000 },
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

module.exports = {
    exp: {
        run: async (Bloom, message) => {
            const jid = message.key?.participant || message.key?.remoteJid;
            const expData = await Exp.findOne({ jid });

            if (!expData) {
                return await Bloom.sendMessage(message.key.remoteJid, { text: "You don't have any EXP yet." });
            }

            const points = expData.points;
            const { current, next } = getLevel(points);

            let response = `🔢 You have *${points}* points.\n`;
            response += `🎖️ Your level: *${current.name}*\n`;

            if (next) {
                const needed = next.min - points;
                response += `⬆️ You need *${needed}* more points to reach *${next.name}*.`;
            } else {
                response += `🏆 You have reached the highest level: *${current.name}*!`;
            }

            await Bloom.sendMessage(message.key.remoteJid, { text: response });
        },
        type: 'user'
    }
};