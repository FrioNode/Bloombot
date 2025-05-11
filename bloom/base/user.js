const os = require('os');
const { exec } = require('child_process');
const { Exp, User } = require('../../colors/schema');
const { mongo, botname, cpyear, mode } = require('../../colors/setup');
const mongoose = require('mongoose');

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
{ name: '🧙 Wizard', min: 3000 }
];

mongoose.connect(mongo, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
}).catch(err => console.error('MongoDB connection error:', err));

const getCurrentDate = () => new Date().toLocaleString();
const runtime = ms => {
    const sec = Math.floor(ms / 1000 % 60);
    const min = Math.floor(ms / (1000 * 60) % 60);
    const hrs = Math.floor(ms / (1000 * 60 * 60));
    return `${hrs}h ${min}m ${sec}s`;
};

const getLevelData = (points) => {
    let current = LEVELS[0], next = null;
    for (let i = 1; i < LEVELS.length; i++) {
        if (points >= LEVELS[i].min) current = LEVELS[i];
        else { next = LEVELS[i]; break; }
    }
    return {
        current,
        next,
        name: current.name,
        nextName: next?.name || 'MAX LEVEL',
        toNext: next ? next.min - points : 0
    };
};

const msToTime = ms => {
    const sec = Math.floor((ms / 1000) % 60);
    const min = Math.floor((ms / (1000 * 60)) % 60);
    const hrs = Math.floor((ms / (1000 * 60 * 60)) % 24);
    return `${hrs}h ${min}m ${sec}s`;
};

const createProgressBar = (percent) => {
    const filled = '▓'.repeat(Math.floor(percent / 5));
    const empty = '░'.repeat(20 - Math.floor(percent / 5));
    return `[${filled}${empty}]`;
};

module.exports = {
    status: {
        type: 'user',
        desc: 'Show system status',
        run: async (Bloom, message, fulltext, commands) => {
            const uptime = process.uptime() * 1000;
            const mem = process.memoryUsage();
            const disk = await new Promise(res => exec('df -h', (_,stdout) => {
                const line = stdout.split('\n').find(l => l.includes('/'));
                res(line.split(/\s+/).slice(1,4));
            }));

            const statusMessage = `----🌼 ${botname} 🌼---
╭──────────────────── 🧠
│  \`\`\`${getCurrentDate()}
│ Uptime: ${runtime(uptime)}
│ Commands: ${Object.keys(commands).length}
│ Platform: ${os.platform()}
│ Server: ${os.hostname()}
│ Memory: ${(os.totalmem()/1e9-os.freemem()/1e9).toFixed(2)} GB / ${(os.totalmem()/1e9).toFixed(2)} GB
│ Heap Mem: ${(mem.heapUsed/1e6).toFixed(2)} MB / ${(mem.heapTotal/1e6).toFixed(2)} MB
│ External Mem: ${(mem.external/1e6).toFixed(2)} MB
│ Disk: ${disk[1]} / ${disk[0]} (Free: ${disk[2]})
│ Mode: ${process.env.NODE_ENV||'development'} | ${mode}\`\`\`
╰─────────────────────── 🚀
> (c) ${cpyear} FioNode - 🦑 •|•`;

            await Bloom.sendMessage(message.key.remoteJid, {text: statusMessage}, {quoted: message});
        }
    },
    exp: {
        type: 'user',
        desc: 'Check your EXP and get daily bonus',
        run: async (Bloom, message) => {
            try {
                if (mongoose.connection.readyState !== 1) throw new Error('Database not connected');
                const jid = message.key?.participant || message.key?.remoteJid;
                const now = new Date();
                let expData = await Exp.findOne({ jid }) || new Exp({ jid, points: 0, streak: 0 });

                let bonusGiven = false;
                if (!expData.lastDaily || now - new Date(expData.lastDaily) > 86400000) {
                    expData.points += 5;
                    expData.lastDaily = now;
                    expData.streak = (expData.streak || 0) + 1;
                    bonusGiven = true;
                }

                await expData.save();
                const { current, next, toNext } = getLevelData(expData.points);

                const response = `╭────📊 EXP REPORT─────
│ 🔢 *${expData.points}* points
│ 🎖️ Level: *${current.name}*
${next ? `│ ⬆️ *${toNext}* more to *${next.name}*` : `│ 🏆 *MAX LEVEL*: ${current.name}`}
${bonusGiven ? `│ 🎁 Daily bonus claimed! (+5 EXP)\n│ 🔥 Streak: *${expData.streak} days*` : `│ 🕒 Daily bonus in: ${msToTime(86400000 - (now - new Date(expData.lastDaily)))}`}
╰────────────────────`;

                await Bloom.sendMessage(message.key.remoteJid, { text: response });
            } catch (err) {
                console.error('EXP Command Error:', err);
                await Bloom.sendMessage(message.key.remoteJid, { text: '❌ Error checking EXP' });
            }
        }
    },
    leader: {
        type: 'user',
        desc: 'See leaderboard for top 10 users',
        run: async (Bloom, message) => {
            const topUsers = await Exp.find().sort({ points: -1 }).limit(10);
            if (!topUsers.length) return await Bloom.sendMessage(message.key.remoteJid, { text: "No users found in the leaderboard yet." });

            const leaderboardText = topUsers.map((user, index) => {
                const { name } = getLevelData(user.points);
                return `${index + 1}. @${user.jid.split('@')[0]} — *${user.points} pts* (${name})`;
            }).join('\n');

            await Bloom.sendMessage(message.key.remoteJid, {
                text: `🏆 *Leaderboard: Top 10*\n\n${leaderboardText}`,
                mentions: topUsers.map(u => u.jid)
            });
        }
    },
    jid: {
        type: 'user',
        desc: 'Returns the group or user JID of the chat',
        run: async (Bloom, message) => {
            await Bloom.sendMessage(message.key.remoteJid, { text: `🆔 Chat JID:\n\n${message.key.remoteJid}` });
        }
    },
    level: {
        type: 'user',
        desc: 'See rank/level of another user',
        run: async (Bloom, message, fulltext) => {
            const text = fulltext.trim().split(' ').slice(1).join(' ').trim();
            let targetJid = message.message?.extendedTextMessage?.contextInfo?.participant;

            if (!targetJid && /^\d{8,15}$/.test(text)) targetJid = `${text}@s.whatsapp.net`;
            if (!targetJid) return await Bloom.sendMessage(message.key.remoteJid, { text: "❗ Please tag a user or provide a valid number." });

            const exp = await Exp.findOne({ jid: targetJid });
            if (!exp) return await Bloom.sendMessage(message.key.remoteJid, { text: `🙁 That user has no EXP yet.` });

            const { name, nextName, toNext } = getLevelData(exp.points);
            await Bloom.sendMessage(message.key.remoteJid, {
                text: `📊 *User:* @${targetJid.split('@')[0]}\n🏅 *Level:* ${name}\n💠 *Points:* ${exp.points} pts\n📈 *To next level:* ${toNext} pts → ${nextName}`,
                                    mentions: [targetJid]
            });
        }
    },
    rank: {
        run: async (...args) => module.exports.level.run(...args),
        type: 'user',
        desc: 'See rank/level of another user'
    },
    profile: {
        type: 'user',
        desc: 'View your full profile statistics',
        run: async (Bloom, message) => {
            const jid = message.key?.participant || message.key?.remoteJid;
            const [expData, userData] = await Promise.all([
                Exp.findOne({ jid }),
                                                          User.findOne({ _id: jid })
            ]);

            if (!expData) return await Bloom.sendMessage(message.key.remoteJid, { text: "❗ No profile found." });

            const { current, next, toNext } = getLevelData(expData.points);
            const inventory = userData?.inventory || {};
            const counts = Object.entries(inventory).map(([k,v]) => `│ ${getIcon(k)} *${k.charAt(0).toUpperCase()+k.slice(1)} Items:* ${v.length}`).join('\n');

            const profile = `╭─────── User Profile ───────
            │ 🧑‍💻 *Username:* @${jid.split('@')[0]}
            │ 🔢 *Points:* ${expData.points}
            │ 🎖️ *Level:* ${current.name}
            ${next ? `│ ⬆️ *${toNext}* to reach *${next.name}*` : `│ 🏆 *MAX LEVEL*: ${current.name}`}
            │ 🗓️ *Join Date:* ${expData.createdAt?.toLocaleDateString() || 'N/A'}
            │ 💰 *Wallet:* ${userData?.walletBalance || 0} 🪙
            │ 🏦 *Bank:* ${userData?.bankBalance || 0} 🏦
            │ 📊 *Messages:* ${expData.messageCount || 0}
            │ 🔥 *Streak:* ${expData.streak || 0} day(s)
            ${counts}
            ╰────────────────────────`;

            await Bloom.sendMessage(message.key.remoteJid, { text: profile, mentions: [jid] });
        }
    },
    progress: {
        type: 'user',
        desc: 'Shows your EXP progress bar',
        run: async (Bloom, message) => {
            const jid = message.key?.participant || message.key?.remoteJid;
            const expData = await Exp.findOne({ jid });
            if (!expData) return await Bloom.sendMessage(message.key.remoteJid, { text: "Start using commands to earn EXP!" });

            const { current, next } = getLevelData(expData.points);
            if (!next) return await Bloom.sendMessage(message.key.remoteJid, { text: `╭───────────────\n│ 🏆 Max Level: *${current.name}*\n╰───────────────` });

            const percent = Math.floor(((expData.points - current.min) / (next.min - current.min)) * 100);
            await Bloom.sendMessage(message.key.remoteJid, {
                text: `╭───────────────
                │ 🎖️ Level: *${current.name}*
                │ 🔋 Progress: [${'▓'.repeat(percent/5)}${'░'.repeat(20-percent/5)}] ${percent}%
                │ ⬆️ *${next.name}* at *${next.min}* points
                ╰───────────────`
            });
        }
    }
};

function getIcon(type) {
    const icons = {
        mining: '🛠️',
        healing: '💉',
        fishing: '🎣',
        animals: '🐶',
        stones: '💎',
        pokemons: '🐾'
    };
    return icons[type] || '▪️';
}