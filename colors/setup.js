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
const GEMINI = 'AIzaSyCUPaxfIdZawsKZKqCqJcC'+'-GWiQPCXKTDc';
const PIXELE = 'khiVE4MkSCKRiKSpyPTnqtxioFSb27'+'YwNNKfzTtKjeSljP8iBYpkvbSS';
function getAll() {
    return {
        session: process.env.SESSION,
        mongo: process.env.MONGO,
        node: process.env.NODE_ENV || 'development',
        sudochat: `${process.env.OWNERNUMBER || '254718241545'}@s.whatsapp.net`,
        sudolid: process.env.SUDOLID || '93282663153890@lid',
        devname: process.env.DEVNAME || 'FrioNode',
        ownername: process.env.OWNERNAME || 'Benson',
        bloomchat: process.env.BLOOMCHAT || '120363154923982755@g.us',
        logschat: process.env.LOGSCHAT || '120363154923982755@g.us',
        openchat: process.env.OPENCHAT || '120363154923982755@g.us',
        invite: process.env.INVITE || 'FJOQhhYlQfR3sv5WxkhWZO',
        channelid: process.env.CHANNELID || '120363321675231023@newsletter',
        channel: process.env.CHANNEL || 'https://whatsapp.com/channel/0029VagLDl6BFLgUIWV9aV2d',
        botname: process.env.BOTNAME || 'Bloom',
        image: process.env.IMAGE || 'https://raw.githubusercontent.com/FrioNode/Bloombot/main/colors/bloom.jpg',
        lang: process.env.LANG || 'EN',
        react: process.env.REACT === 'true',
        emoji: process.env.EMOJI || '🌼',
        reboot: process.env.REBOOT === 'true',
        isdocker: process.env.IS_DOCKER,
        prefix: process.env.PREFIX || '!',
        timezone: process.env.TIMEZONE || 'Africa/Nairobi',
        mode: process.env.MODE || 'public',
        weatherKey: process.env.WEATHERKEY,         // https://openweathermap.org/api
        pixelkey: process.env.PIXELKEY || PIXELE,
        ninjaKey: process.env.NINJAKEY,              // https://api-ninjas.com/api
        gemini: process.env.GEMINI || GEMINI,
        deepseek: process.env.DEEPSEEK,             // https://platform.deepseek.com/api_keys
        pastebinapi: process.env.PASTEBINAPI || 'pastebin-api',
        bloom: Bot,
        maxStoreMessages: process.env.MAXSROREMESSAGES || 20,
        storeWriteInterval: process.env.STOREWRITEINTERVAL || 10000,
        cpyear: new Date().getFullYear()
    };
}

const config = getAll();

module.exports = {
    ...config,
    _getAll: getAll,
    _reload: () => getAll()
};
