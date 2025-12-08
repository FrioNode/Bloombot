const { default: makeWASocket, fetchLatestBaileysVersion, DisconnectReason, jidNormalizedUser,
                useMultiFileAuthState, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const {botname, session, mode,react,emoji,image,invite, logschat,channel,channelid, storeWriteInterval} = require('./colors/setup');
const { bloomCmd, initCommandHandler, startReminderChecker } = require('./bloom/brain');  const { startStatusWatcher } = require('./bloom/statusview');
const pino = require('pino'); const fs = require('fs'); const path = require('path'); const axios = require('axios'); const NodeCache = require("node-cache");
const { emojis, doReact } = require('./colors/react'); const mess = require('./colors/mess');
const qrCode = require('qrcode-terminal'); const express = require('express'); const isDocker = require('is-docker').default;
const { _autoStartGame } = require('./bloom/base/games');
//const log = (...args) => console.log('Luna:',new Date().toLocaleString(), '|', ...args);

const log = (...args) => {
  const stack = new Error().stack.split('\n');
  const callerLine = stack[2]; // line where log() was called
  const fileMatch = callerLine.match(/\/([^\/\)]+):\d+:\d+\)?$/);
  const file = fileMatch ? fileMatch[1] : 'unknown';

  console.log(`Luna: ${new Date().toLocaleString()} | [${file}]`, ...args);
};
// ------
let stopPokemonGame; const app = express();
const serverStartTime = Date.now(); let useQR = false; let initialConnection = true;
const PORT = process.env.PORT || 3000;

const sessionDir = path.join(__dirname, 'heart');
const credsPath = path.join(sessionDir, 'creds.json');
const store = require('./colors/luna_store');

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
        const msgRetryCounterCache = new NodeCache()
        const { version, isLatest } = await fetchLatestBaileysVersion();
        log(`${botname} on Baileys V${version.join('.')}, Is latest ?: ${isLatest}`);

        const Luna = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),  browser: ["Luna", "Safari", "3.3"],
        auth: { creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            } , syncFullHistory: false,  markOnlineOnConnect: true,
            getMessage: async (key) => {
                let jid = jidNormalizedUser(key.remoteJid)
                let msg = await store.loadMessage(jid, key.id)
                return msg?.message || `${botname} for whatsapp space mode`
            }, msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000 });

        Luna.ev.on('connection.update', async (update) => {
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

                        try {
                                await Luna.groupMetadata(logschat);
                                log(`📛 Already in logschat group: ${logschat}`);
                            } catch (err) {
                                log(`⚠️ Not in group ${logschat}, attempting to join...`);

                                try {
                                    const groupId = await Luna.groupAcceptInvite(invite);
                                    log(`✅ Successfully joined group: ${groupId}`);
                                } catch (joinErr) {
                                    log(`❌ Couldn't join group: ${joinErr.message}`);
                                }
                            }

                            try {
                                await Luna.sendMessage(logschat, Payload);
                            } catch (sendErr) {
                                log(`❌ Failed to send startup message: ${sendErr.message}`);
                            }

                        await startReminderChecker(Luna);
                        await startStatusWatcher(Luna, log);
                        await initCommandHandler(Luna);
                        if (react === 'true') { log("🤖 Auto React is enabled"); }
                        else { log("⚠️ Auto React is disabled"); }
                        stopPokemonGame = await _autoStartGame(Luna);
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

        async function processReactionQueue(Luna) {
            if (reactionQueue.length > 100) reactionQueue.shift();
            if (isProcessingQueue) return; isProcessingQueue = true;

            while (reactionQueue.length > 0) {
                const { emoji, message } = reactionQueue.shift();
                try { await doReact(Luna, emoji, message);
                } catch (err) { log('Error during auto reaction:', err);  }
                await new Promise(res => setTimeout(res, REACTION_DELAY));
            }  isProcessingQueue = false; }

        Luna.ev.on('creds.update', saveCreds); const processedMessages = new Set();
        Luna.ev.on("messages.upsert", async (chatUpdate) => {
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
                reactionQueue.push({ emoji: randomEmoji, message }); processReactionQueue(Luna);   }

            try {
                await bloomCmd(Luna, message);
            } catch (err) { log("Luna Commands Error:", err); }  });

        if (mode === "public") {  Luna.public = true; } else if (mode === "private") {
            Luna.public = false;  } } catch (error) {
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

store.readFromFile();
setInterval(() => store.writeToFile(), storeWriteInterval || 10000);

if (isDocker()) { log(`${emoji} ${botname} is running inside a Docker container`); } else { log(`${emoji} ${botname} is running locally`); }

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