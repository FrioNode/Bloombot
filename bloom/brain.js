const fs = require('fs');
const path = require('path');
const setup = require('../colors/setup');
const mess = require('../colors/mess');

const commands = {};

// Load all `.js` files from all folders in current directory (excluding self)
const currentDir = __dirname;
const subdirs = fs.readdirSync(currentDir).filter(file => {
    const fullPath = path.join(currentDir, file);
    return fs.statSync(fullPath).isDirectory();
});

for (const dir of subdirs) {
    const files = fs.readdirSync(path.join(currentDir, dir));
    for (const file of files) {
        if (file.endsWith('.js') && !file.startsWith('_')) {
            const module = require(path.join(currentDir, dir, file));
            console.log(`📦 Loading from ${dir}/${file}:`, Object.keys(module));
            Object.assign(commands, module);
        }
    }
}

const bloomCmd = async (message, Bloom ) => {
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const fulltext = text.trim().replace(/^\s*!/, '').replace(/\s+/g, ' ');
    const command = fulltext.split(' ')[0].toLowerCase();

    console.log("🧠 Available commands:", Object.keys(commands));
    console.log("🧠 Requested command:", command);

    if (commands[command]) {
        try {
            await commands[command](Bloom, message, fulltext);
            console.log("✅ Command executed:", fulltext);
        } catch (err) {
            console.error(`❌ Error in ${command}:`, err);
            // error messaging logic
        }
    } else {
        console.warn(`⚠️ Command "${command}" not found in loaded commands.`);
    }
};

module.exports = { bloomCmd };
