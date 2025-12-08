const fs = require('fs');
const path = require('path');
const { emojis } = require('../colors/react');

const DB_PATH = path.join(__dirname, 'viewedStatus.json');

function loadViewed() {
    try {
        return new Set(JSON.parse(fs.readFileSync(DB_PATH, 'utf8')));
    } catch {
        return new Set();
    }
}

function saveViewed(set) {
    fs.writeFileSync(DB_PATH, JSON.stringify([...set], null, 2));
}

async function startStatusWatcher(Luna, log) {
    const viewed = loadViewed(); // 🔥 persistent

    Luna.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            if (msg.key.remoteJid !== 'status@broadcast') continue;

            const sender = msg.key.participant;
            const uid = `${msg.key.remoteJid}|${sender}|${msg.key.id}`;

            // Already seen?
            if (viewed.has(uid)) continue;

            viewed.add(uid);
            saveViewed(viewed);

            try {
                await Luna.readMessages([msg.key]);
                log(`👁️ Viewed status from ${sender}`);

                const emoji = emojis[Math.floor(Math.random() * emojis.length)];

                await Luna.sendMessage(sender, {
                    react: { text: emoji, key: msg.key }
                });

                log(`💬 Reacted to ${sender}'s status with ${emoji}`);

            } catch (err) {
                log('❌ Error during status processing:', err);
            }
        }
    });
}

module.exports = { startStatusWatcher };