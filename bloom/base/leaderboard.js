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
    for (let i = 1; i < LEVELS.length; i++) {
        if (points >= LEVELS[i].min) current = LEVELS[i];
        else break;
    }
    return current.name;
}

module.exports = {
    leader: {
        run: async (Bloom, message) => {
            const topUsers = await Exp.find().sort({ points: -1 }).limit(10);

            if (!topUsers.length) {
                return await Bloom.sendMessage(message.key.remoteJid, { text: "No users found in the leaderboard yet." });
            }

            const leaderboardText = topUsers.map((user, index) => {
                const tag = user.jid.split('@')[0];
                const level = getLevel(user.points);
                return `${index + 1}. @${tag} — *${user.points} pts* (${level})`;
            }).join('\n');

            await Bloom.sendMessage(message.key.remoteJid, {
                text: `🏆 *Leaderboard: Top 10*\n\n${leaderboardText}`,
                mentions: topUsers.map(u => u.jid)
            });
        },
        type: 'user',
        desc: 'See leaderboard for top 10 user'
    }
};
