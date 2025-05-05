const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Bot = require('../package.json');

const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function convertToBool(text, fault = 'true') {
    return text === fault;
}

module.exports = {
    // .env (critical/private)
    session: process.env.SESSION,
    mongo: process.env.MONGO,
    sudoChat: `${process.env.OWNERNUMBER || config.ownerNumber}@s.whatsapp.net`,

    // dynamic config.json
    ...config,

    cpYear: new Date().getFullYear(),
    bloom: Bot
};