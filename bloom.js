const { default: makeWASocket, fetchLatestBaileysVersion, DisconnectReason, useMultiFileAuthState } = require('baileys');
const {botname, session, mode,react,emoji,image,logschat,channel,channelid} = require('./colors/setup');
const { bloomCmd, initCommandHandler, startReminderChecker } = require('./bloom/brain');
const pino = require('pino'); const fs = require('fs'); const path = require('path'); const axios = require('axios');
const { emojis, doReact } = require('./colors/react'); const mess = require('./colors/mess');
const qrCode = require('qrcode-terminal'); const express = require('express');
const { _autoStartGame } = require('./bloom/base/games');
const log = (...args) => console.log('Bloom:',new Date().toLocaleString(), '|', ...args);
let stopPokemonGame; const app = express();
const serverStartTime = Date.now(); let useQR = false; let initialConnection = true;
const PORT = process.env.PORT || 3000;

const sessionDir = path.join(__dirname, 'heart');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true }); }

async function downloadSessionData() {
    if (!session || !session.startsWith("BLOOM~")) {
        console.warn("⚠️ No valid SESSION env found (expected format: BLOOM~XXXXXX)");
        return false;   }

    const pasteId = session.split("BLOOM~")[1];
    const url = `https://pastebin.com/raw/${pasteId}`;

    try {
        const response = await axios.get(url);
        const data = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

        await fs.promises.writeFile(credsPath, data);
        log("✅ Session successfully downloaded and saved from Pastebin.");
        return true;
    } catch (error) {
        log("❌ Failed to download session from Pastebin:", error.message);
        return false; } }
async function start() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        log(`${botname} on Baileys V${version.join('.')}, Is latest ?: ${isLatest}`);

        const Bloom = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),  browser: ["Bloom", "Safari", "3.3"],
        auth: state, getMessage: async (key) => {
                if (store) { const msg = await store.loadMessage(key.remoteJid, key.id);
        return msg?.message || undefined; } return { conversation: `${botname} for whatsapp Automation` };  } });

        Bloom.ev.on('connection.update', async (update) => {
            const { qr, connection, lastDisconnect } = update;

            if (qr && useQR) { log("📷 Scan this QR to login:\n");
                qrCode.generate(qr, { small: true }); }

            if (connection === 'open') { log("✅ Connected successfully");
                if (initialConnection) {
                    log(`${emoji} ${botname} is now online`);
                    if (!botname || !logschat || !image) {
                        throw new Error("Missing essential config in colors/setup.js"); }

                    if (mess && mess.bloom && mess.powered) {
                        const Payload = {  image: { url: image }, caption: mess.bloom,
        contextInfo: { isForwarded: true, forwardingScore: 2, forwardedNewsletterMessageInfo: {
        newsletterJid: channelid, newsletterName: botname,
        serverMessageId: -1, }, externalAdReply: {   title: botname,
        body: mess.powered, thumbnailUrl: image,
        sourceUrl: channel, mediaType: 1, renderLargerThumbnail: false, }, }, };

                        await Bloom.sendMessage(logschat, Payload);
                        await startReminderChecker(Bloom);

                        stopPokemonGame = await _autoStartGame(Bloom);
                        process.on('SIGINT', () => { stopPokemonGame?.(); process.exit(); });
                    } else { log('Failed to retrieve starting message data.'); }

                    initialConnection = false;
                } else {  log("♻️ Connection re-established after restart.");    } }

            if (connection === 'close') {
                log("❌ Connection closed.");
                const statusCode = lastDisconnect?.error?.output?.statusCode;

                if (statusCode !== DisconnectReason.loggedOut) {
                    log('♻️ Attempting reconnect...');
                    start();
                } else { console.warn('🚫 You have been logged out.');  }  }  });

        const reactionQueue = []; let isProcessingQueue = false; const REACTION_DELAY = 1000;

        async function processReactionQueue(Bloom) {
            if (reactionQueue.length > 100) reactionQueue.shift();
            if (isProcessingQueue) return; isProcessingQueue = true;

            while (reactionQueue.length > 0) {
                const { emoji, message } = reactionQueue.shift();
                try { await doReact(Bloom, emoji, message);
                } catch (err) { log('Error during auto reaction:', err);  }
                await new Promise(res => setTimeout(res, REACTION_DELAY));
            }  isProcessingQueue = false; }

        Bloom.ev.on('creds.update', saveCreds); const processedMessages = new Set();
        Bloom.ev.on("messages.upsert", async (chatUpdate) => {
            if (chatUpdate.type !== 'notify') return;
            const message = chatUpdate.messages && chatUpdate.messages[0];
            if (!message || !message.message || message.key.fromMe) return;

            const msgId = message.key.id;
            if (processedMessages.has(msgId)) return; processedMessages.add(msgId);

            if (processedMessages.size > 1000) {
                const iterator = processedMessages.values();
                processedMessages.delete(iterator.next().value);  }

            if (process.env.REACT === 'true') {
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                reactionQueue.push({ emoji: randomEmoji, message }); processReactionQueue(Bloom);   }

            try {  await bloomCmd(Bloom, message);  } catch (err) { log("Bloom Commands Error:", err); }  });

        if (mode === "public") {  Bloom.public = true; } else if (mode === "private") {
            Bloom.public = false;  } } catch (error) {
        log('Critical Error:', error);
        process.exit(1); } }

async function init() {
    if (fs.existsSync(credsPath)) {
        log("🔒 Existing session file found. Starting without QR...");
        await start(); } else {
            log("🔍 Session file not found. Trying SESSION env...");
        const downloaded = await downloadSessionData();
        if (downloaded && fs.existsSync(credsPath)) {
            log("🔄 Starting with downloaded session...");
            await start(); } else {
            log("📸 Falling back to QR code login...");
            useQR = true; await start(); } } }

init();

app.use(express.static(path.join(__dirname, 'colors')));
app.get('/', (req, res) => {  res.sendFile(path.join(__dirname, 'colors', 'bloom.html')); });

app.listen(PORT, () => { log(`🔒 ${botname} Server is running on port ${PORT}`); });

app.get('/uptime', (req, res) => {
    const now = Date.now();
    const diff = now - serverStartTime;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    res.json({ days, hours, minutes, seconds });
});
app.get('/status', (_, res) => res.send(`✅ ${botname} bot is online`));