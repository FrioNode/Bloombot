const { Exp, User } = require('../../colors/schema');
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
function getLeve(points) {
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

            const { current, next } = getLeve(expData.points);

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
    },
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
    },
        jid: {
            type: 'user',
            desc: 'Returns the group or user JID of the chat',
            run: async (Bloom, message) => {
                const jid = message.key.remoteJid;
                await Bloom.sendMessage(jid, { text: `🆔 Chat JID:\n\n${jid}` });
            }
        },
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
            },
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
                    const { current, next } = getLeve(points);

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
            },
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
