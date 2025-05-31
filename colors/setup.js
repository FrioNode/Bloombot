const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Bot = require('../package.json');

// Load .env if not in production
if (process.env.NODE_ENV !== 'production') {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        console.log('[ENV] Loaded .env from', envPath);
    } else {
        console.warn('[ENV] .env not found at', envPath);
    }
}

function getAll() {
    return {
        session: process.env.SESSION,
        mongo: process.env.MONGO,
        redisurl: process.env.REDIS_URL,
        node: process.env.NODE_ENV || 'development',
        sudochat: `${process.env.OWNERNUMBER || '254718241545'}@s.whatsapp.net`,
        devname: process.env.DEVNAME || 'FrioNode',
        ownername: process.env.OWNERNAME || 'Benson',
        bloomchat: process.env.BLOOMCHAT || '120363154923982755@g.us',
        logschat: process.env.LOGSCHAT || '120363154923982755@g.us',
        openchat: process.env.OPENCHAT || '120363154923982755@g.us',
        channelid: process.env.CHANNELID || '120363321675231023@newsletter',
        channel: process.env.CHANNEL || 'https://whatsapp.com/channel/0029VagLDl6BFLgUIWV9aV2d',
        botname: process.env.BOTNAME || 'Bloom',
        image: process.env.IMAGE || 'https://raw.githubusercontent.com/FrioNode/Bloombot/main/colors/bloom.jpg',
        lang: process.env.LANG || 'EN',
        antilink: process.env.ANTILINK || 'OFF',
        react: process.env.REACT === 'true',
        emoji: process.env.EMOJI || '🌼',
        reboot: process.env.REBOOT === 'true',
        prefix: process.env.PREFIX || '!',
        timezone: process.env.TIMEZONE || 'Africa/Nairobi',
        mode: process.env.MODE || 'public',
        pixelkey: process.env.PIXELKEY || 'khiVE4MkSCKRiKSpyPTnqtxioFSb27YwNNKfzTtKjeSljP8iBYpkvbSS',
        gemini: process.env.GEMINI || 'AIzaSyCUPaxfIdZawsKZKqCqJcC-GWiQPCXKTDc',
        deepseek: process.env.DEEPSEEK || 'https://platform.deepseek.com/api_keys',
        pastebinapi: process.env.PASTEBINAPI || 'pastebin-api',
        bloom: Bot,
        cpyear: new Date().getFullYear()
    };
}

const config = getAll();

module.exports = {
    ...config,
    _getAll: getAll,
    _reload: () => getAll()
};
