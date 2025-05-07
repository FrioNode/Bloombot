const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Bot = require('../package.json');
const { caption } = require('./mess');
const configPath = path.join(__dirname, 'config.json');

function getConfig() {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function getAll() {
    const config = getConfig();
    return {
        ...config,
        session: process.env.SESSION,
        mongo: process.env.MONGO,
        sudoChat: `${process.env.OWNERNUMBER || config.ownerNumber}@s.whatsapp.net`,
        bloom: Bot,
        caption: caption,
        cpYear: new Date().getFullYear()
    };
}

module.exports = {
    getConfig,
    get: (key) => getAll()[key],
    all: () => getAll()
};