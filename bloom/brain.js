const fs = require('fs');
const path = require('path');
const setup = require('../colors/setup');
const mess = require('../colors/mess');
const { trackUsage}  = require('../colors/exp');

const commands = {};

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
            for (const [cmd, data] of Object.entries(module)) {
                if (typeof data.run === 'function') {
                    commands[cmd] = data;
                    console.log(`📦 Loaded command: ${cmd} (type: ${data.type})`);
                } else {
                    console.warn(`⚠️ Skipping invalid command format: ${cmd}`);
                }
            }
        }
    }
}


const bloomCmd = async (message, Bloom ) => {
    const senderJid = message.key?.participant || message.key?.remoteJid;
    if (senderJid) await trackUsage(senderJid);

    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const fulltext = text.trim().replace(/^\s*!/, '').replace(/\s+/g, ' ');
    const command = fulltext.split(' ')[0].toLowerCase();

    // console.log("🧠 Available commands:", Object.keys(commands));
    // console.log("🧠 Requested command:", command);

    if (commands[command]) {
        try {
            await commands[command].run(Bloom, message, fulltext, commands);
            console.log("✅ Command executed:", fulltext);
        } catch (err) {
            console.error(`❌ Error in ${command}:`, err);
        }
    } else {
        console.warn(`⚠️ Command "${command}" not found in loaded commands.`);
    }
};

module.exports = { bloomCmd };