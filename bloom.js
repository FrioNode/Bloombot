const { makeWASocket, Browsers, fetchLatestBaileysVersion, DisconnectReason, useMultiFileAuthState } = require('baileys');
const {session,botname,mode,react,emoji,image,errorchat,channel,channelid} = require('./colors/setup');
const { bloomCmd, initCommandHandler } = require('./bloom/brain'); // 🔥 Updated import
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { emojis, doReact } = require('./colors/react');
const mess = require('./colors/mess');
const qrCode = require('qrcode-terminal');
const express = require('express');
const { _autoStartGame } = require('./bloom/base/games');
const chokidar = require('chokidar'); // 🔥 NEW: For config watching

let stopPokemonGame;
const app = express();
const serverStartTime = Date.now();

let useQR = false;
let initialConnection = true;
const PORT = process.env.PORT || 3000;

const sessionDir = path.join(__dirname, 'heart');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

// 🔥 NEW: Config watcher setup
function setupConfigWatcher(Bloom) {
    const watcher = chokidar.watch(path.join(__dirname, 'colors/config.json'), {
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 2000,
            pollInterval: 100
        }
    });

    watcher.on('change', async () => {
        console.log('⚡ Config changed - refreshing commands');
        try {
            // Safe reload of command handler
            delete require.cache[require.resolve('./bloom/brain')];
            const { initCommandHandler } = require('./bloom/brain');
            await initCommandHandler(Bloom);
        } catch (err) {
            console.error('Config reload failed:', err);
        }
    });
}

async function downloadSessionData() {
    if (!session) {
        console.error('Please add your session to SESSION_ID env !!');
        return false;
    }
    const sessdata = session.split("BLOOM~")[1];
    const url = `https://pastebin.com/raw/${sessdata}`;
    try {
        const response = await axios.get(url);
        const data = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        await fs.promises.writeFile(credsPath, data);
        console.log("🔒 Session Successfully Loaded !!");
        return true;
    } catch (error) {
        console.error('Failed to download session data');
        return false;
    }
}

async function start() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`${botname} on Baileys V${version.join('.')}, Is latest ?: ${isLatest}`);

        const Bloom = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
                                   printQRInTerminal: useQR,
                                   browser: ["Bloom", "safari", "3.3"],
                                   auth: state,
                                   getMessage: async (key) => {
                                       if (store) {
                                           const msg = await store.loadMessage(key.remoteJid, key.id);
                                           return msg.message || undefined;
                                       }
                                       return { conversation: `${botname} for whatsapp Automation` };
                                   }
        });

        // 🔥 Initialize command handler with Bloom instance
        await initCommandHandler(Bloom);

        // 🔥 Start watching config changes
        setupConfigWatcher(Bloom);

        // QR Code event listener
        Bloom.ev.on('qr', (qr) => {
            if (useQR) { qrCode.generate(qr, { small: true }); }
        });

        Bloom.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                    console.log('Reconnecting...');
                    start();
                }
            } else if (connection === 'open') {
                if (initialConnection) {
                    console.log(`${emoji}  ${botname} is now online`);

                    if (mess) {
                        const Payload = {
                            image: { url: image },
                            caption: mess.bloom,
                            contextInfo: {
                                isForwarded: true,
                                forwardingScore: 2,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterJid: channelid,
                                        newsletterName: botname,
                                        serverMessageId: -1,
                                    },
                                    externalAdReply: {
                                        title: botname,
                                        body: mess.powered,
                                        thumbnailUrl: image,
                                        sourceUrl: channel,
                                        mediaType: 1,
                                        renderLargerThumbnail: false,
                                    },
                            },
                        };
                        await Bloom.sendMessage(errorchat, Payload);
                        (async () => {
                            stopPokemonGame = await _autoStartGame(Bloom);
                        })();

                        process.on('SIGINT', () => {
                            stopPokemonGame?.();
                            process.exit();
                        });
                    } else {
                        console.error('Failed to retrieve starting message data.');
                    }
                    initialConnection = false;
                } else {
                    console.log("♻️ Connection re-established after restart.");
                }
            }
        });

        Bloom.ev.on('creds.update', saveCreds);
        Bloom.ev.on("messages.upsert", async (chatUpdate) => {
            const message = chatUpdate.messages?.[0];
            if (!message || !message.message || message.key.fromMe) return;
            if (react) {
                try {
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    await doReact(Bloom, randomEmoji, message);
                } catch (err) {
                    console.error('Error during auto reaction:', err);
                }
            }
            await bloomCmd(Bloom, message);
        });

        if (mode === "public") {
            Bloom.public = true;
        } else if (mode === "private") {
            Bloom.public = false;
        }

    } catch (error) {
        console.error('Critical Error:', error);
        process.exit(1);
    }
}

async function init() {
    if (fs.existsSync(credsPath)) {
        console.log("🔒 Session file found, proceeding without QR code.");
        await start();
    } else {
        console.log("No session found, generating QR code for authentication...");
        useQR = true;
        await start();
    }
}

init();

app.use(express.static(path.join(__dirname, 'colors')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'colors', 'bloom.html'));
});

app.listen(PORT, () => {
    console.log(`${botname} Server is running on port ${PORT}`);
});

app.get('/uptime', (req, res) => {
    const now = Date.now();
    const diff = now - serverStartTime;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    res.json({ days, hours, minutes, seconds });
});