const fs = require('fs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../config.env') });
function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

const Bot=require('../package.json');
module.exports = {
    session: process.env.SESSION,
    devName: process.env.USERNAME || "FrioNode",
    cpYear: new Date().getFullYear(),
    ownerName: process.env.OWNERNAME || "Benson",
    ownerNumber: process.env.OWNERNUMBER || "254718241545",
    sudoChat: (process.env.OWNERNUMBER || "254718241545")+"@s.whatsapp.net",
    bloomChat : process.env.BLOOMCHAT || "120363396597813391@g.us",
    errorChat: process.env.ERRORCHAT || "120363154923982755@g.us",
    openChat: process.env.OPENCHAT || "120363396597813391@g.us",
    channelid: process.env.CHANNELID || "120363321675231023@newsletter",
    channel: process.env.CHANNEL || "https://whatsapp.com/channel/0029VagLDl6BFLgUIWV9aV2d",
    botName: process.env.BOT_NAME || "BloomBot",
    image: process.env.IMAGE || "https://raw.githubusercontent.com/FrioNode/Bloombot/main/colors/bloom.jpg",
    lang: process.env.LANGUAGE || "EN",
    antilink: process.env.ANTILINK || "OFF",
    react: process.env.REACT || true,
    emoji: process.env.EMOJI || "🌼",
    bloom: Bot, reboot: process.env.REBOOT || "false",
    Node: process.env.NODE_ENV || "development",
    prefix: process.env.PREFIX || "!",
    timezone: process.env.TIMEZONE || 'Africa/Nairobi',
    mode: process.env.MODE || "public",
    mongo: process.env.MONGO,
    pixelKey: process.env.PIXEL_API_KEY || 'https://www.pexels.com/api/',
    deepSeek: process.env.DEEPSEEK_API || 'https://platform.deepseek.com/api_keys',
    pasteBinApi: process.env.PASTE_BIN_API || 'pastebin-api'
};