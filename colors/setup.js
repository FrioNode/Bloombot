const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

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

const Bot = require('../package.json');

function getAll() {
    return {
        session: process.env.SESSION,
        mongo: process.env.MONGO,
        redisurl: process.env.REDIS_URL,
        node: process.env.NODE_ENV || 'development',
        sudochat: `${process.env.OWNERNUMBER}@s.whatsapp.net`,
        devname: process.env.DEVNAME,
        ownername: process.env.OWNERNAME,
        bloomchat: process.env.BLOOMCHAT,
        logschat: process.env.LOGSCHAT,
        openchat: process.env.OPENCHAT,
        channelid: process.env.CHANNELID,
        channel: process.env.CHANNEL,
        botname: process.env.BOTNAME,
        image: process.env.IMAGE,
        lang: process.env.LANG,
        antilink: process.env.ANTILINK,
        react: process.env.REACT === 'true',
        emoji: process.env.EMOJI,
        reboot: process.env.REBOOT === 'true',
        prefix: process.env.PREFIX,
        timezone: process.env.TIMEZONE,
        mode: process.env.MODE,
        pixelkey: process.env.PIXELKEY,
        deepseek: process.env.DEEPSEEK,
        pastebinapi: process.env.PASTEBINAPI,
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