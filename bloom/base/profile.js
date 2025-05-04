const { Exp, User } = require('../../colors/schema');

module.exports = {
    profile: {
        run: async (Bloom, message) => {
            const jid = message.key?.participant || message.key?.remoteJid;
            const expData = await Exp.findOne({ jid });

            if (!expData) {
                return await Bloom.sendMessage(message.key.remoteJid, {
                    text: "❗ No profile found. You haven't started using the system yet."
                });
            }

            // Get user's experience level
            const { points } = expData;
            const { current, next } = getLevel(points);

            // Fetch additional data from the User schema
            const userData = await User.findOne({ _id: jid });

            if (!userData) {
                return await Bloom.sendMessage(message.key.remoteJid, {
                    text: "❗ No user data found."
                });
            }

            // Extract counts for various items
            const miningCount = userData.inventory.mining.length;
            const healingCount = userData.inventory.healing.length;
            const fishingCount = userData.inventory.fishing.length;
            const animalsCount = userData.inventory.animals.length;
            const stonesCount = userData.inventory.stones.length;
            const pokemonsCount = userData.inventory.pokemons.length;
            const walletBalance = userData.walletBalance || 0;
            const bankBalance = userData.bankBalance || 0;
            const messageCount = expData.messageCount || 0;
            const streak = expData.streak || 0;

            const joinDate = expData.createdAt ? new Date(expData.createdAt).toLocaleDateString() : 'N/A';

            let profile = `╭─────── User Profile ───────\n`;
            profile += `│ 🧑‍💻 *Username:* @${jid.split('@')[0]}\n`;
            profile += `│ 🔢 *Points:* ${expData.points}\n`;
            profile += `│ 🎖️ *Level:* ${current.name}\n`;
            profile += `│ ⬆️ *Next Level:* ${next ? next.name : 'MAX LEVEL'}\n`;

            if (next) {
                const needed = next.min - expData.points;
                profile += `│ ⬆️ *${needed}* to reach *${next.name}*.\n`;
            } else {
                profile += `│ 🏆 *MAX LEVEL*: ${current.name}\n`;
            }

            profile += `│ 🗓️ *Join Date:* ${joinDate}\n`;
            profile += `│ 💰 *Wallet Balance:* ${walletBalance} 🪙\n`;
            profile += `│ 🏦 *Bank Balance:* ${bankBalance} 🏦\n`;
            profile += `│ 📊 *Message Count:* ${messageCount}\n`;
            profile += `│ 🔥 *Daily Streak:* ${streak > 0 ? streak : 'N/A'} day(s)\n`;

            // Adding inventory counts
            profile += `│ 🛠️ *Mining Items:* ${miningCount}\n`;
            profile += `│ 💉 *Healing Items:* ${healingCount}\n`;
            profile += `│ 🎣 *Fishing Items:* ${fishingCount}\n`;
            profile += `│ 🐶 *Animals:* ${animalsCount}\n`;
            profile += `│ 💎 *Stones:* ${stonesCount}\n`;
            profile += `│ 🐾 *Pokemons:* ${pokemonsCount}\n`;

            profile += `╰────────────────────────`;

            await Bloom.sendMessage(message.key.remoteJid, {
                text: profile,
                mentions: [jid]
            });
        },
        type: 'user',
        desc: 'View your full profile statistics based on usage'
    }
};

// Function to get the current level and the next level based on points
function getLevel(points) {
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