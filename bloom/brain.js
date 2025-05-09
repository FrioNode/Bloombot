const mongoose = require('mongoose');
const { Settings, UserCounter, AFK } = require('../colors/schema');
const { mongo, node, sudochat, mode, _reload } = require('../colors/setup'); _reload();
const mess = require('../colors/mess');
const { trackUsage } = require('../colors/exp');
const { tttmove } = require('./tttmove');
const options = { serverSelectionTimeoutMS: 30000, socketTimeoutMS: 45000 };
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');

// MongoDB connection with error handling
mongoose.connect(mongo, options)
.then(() => console.log('Brain: Successfully connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Command registry with init capability
let commandRegistry = {};
let activeBloomInstance = null;

// Initialize command handler
async function initCommandHandler(Bloom) {
    activeBloomInstance = Bloom;
    commandRegistry = {};
    await loadCommands();
    console.log('♻️ Command handler initialized');
}

// Safe command loader
async function loadCommands() {
    try {
        const currentDir = __dirname;
        const subdirs = fs.readdirSync(currentDir).filter(file => {
            try {
                const fullPath = path.join(currentDir, file);
                return fs.statSync(fullPath).isDirectory();
            } catch (e) {
                console.warn(`⚠️ Couldn't access directory ${file}:`, e.message);
                return false;
            }
        });

        for (const dir of subdirs) {
            try {
                const files = fs.readdirSync(path.join(currentDir, dir));
                for (const file of files) {
                    if (file.endsWith('.js') && !file.startsWith('_')) {
                        try {
                            const modulePath = path.join(currentDir, dir, file);
                            delete require.cache[require.resolve(modulePath)]; // Clear cache
                            const module = require(modulePath);

                            for (const [cmd, data] of Object.entries(module)) {
                                if (cmd.startsWith('_')) {
                                    console.log(`⏩ Skipping internal command: ${cmd}`);
                                    continue;
                                }
                                if (typeof data?.run === 'function') {
                                    commandRegistry[cmd] = data;
                                    console.log(`📦 Loaded command: ${cmd} (type: ${data.type})`);
                                } else {
                                    console.warn(`⚠️ Skipping invalid command format: ${cmd} in ${file}`);
                                }
                            }
                        } catch (err) {
                            console.error(`❌ Failed to load command file: ${dir}/${file}`);
                            console.error(err);
                        }
                    }
                }
            } catch (e) {
                console.error(`❌ Error reading command directory ${dir}:`, e);
            }
        }
        console.log(`📦 Total loaded commands: ${Object.keys(commandRegistry).length}`);
    } catch (e) {
        console.error('❌ Critical error loading commands:', e);
    }

}

// Command execution handler
async function bloomCm(Bloom, message, fulltext, commands) {
    const senderJid = message.key?.participant || message.key?.remoteJid;
    if (senderJid) await trackUsage(senderJid);

    let commandName = fulltext.split(' ')[0].toLowerCase();

    // 🟢 ONLY CHANGE: Treat numbers 1-9 as tttmove command
    if (!isNaN(commandName) && commandName >= 1 && commandName <= 9) {
        commandName = 'tttmove';
    }

    // 🔴 EVERYTHING BELOW REMAINS EXACTLY THE SAME
    const commandModule = commands[commandName];

    if (!commandModule || typeof commandModule.run !== 'function') return;

    try {
        await commandModule.run(Bloom, message, fulltext, commands);
        console.log(`✅ Command executed: ${commandName}`);
    } catch (err) {
        console.error(`❌ Error running command "${commandName}":`, err);
        await Bloom.sendMessage(message.key.remoteJid, {
            text: '❗ An error occurred while executing the command.',
        });
    }
}

// Hot reload functionality
function setupHotReload() {
    if (node === 'production') return;

    const lastReloadTimes = new Map();
    const DEBOUNCE_MS = 500;

    const watchPaths = [
        path.join(__dirname, '**/*.js'),
                  path.join(__dirname, '../colors/*.js'),
                  path.join(__dirname, '../plugin.js'),
                  '!' + path.join(__dirname, 'brain.js'),
                  '!' + path.join(__dirname, '**/_*.js'),
                  '!' + path.join(__dirname, '../colors/schema.js')
    ];

    const watcher = chokidar.watch(watchPaths, {
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 500,
            pollInterval: 100
        },
        ignorePermissionErrors: true
    });

    watcher.on('change', async (changedPath) => {
        const now = Date.now();
        const lastReload = lastReloadTimes.get(changedPath) || 0;
        if (now - lastReload < DEBOUNCE_MS) return;
        lastReloadTimes.set(changedPath, now);

        if (changedPath.includes('schema.js')) return;

        const relativePath = path.relative(path.join(__dirname, '../'), changedPath);

        if (changedPath.includes('/colors/') || changedPath.endsWith('plugin.js')) {
            console.log(`🎨 Reloading config: ${relativePath}`);
            try {
                delete require.cache[require.resolve(changedPath)];
                require(changedPath);
            } catch (err) {
                console.error(`❌ Config reload failed: ${relativePath}`, err);
            }
            return;
        }

        console.log(`♻️ Reloading commands due to change in: ${relativePath}`);
        try {
            await loadCommands();
        } catch (err) {
            console.error('Reload failed:', err);
        }
    });

    console.log('🔥 Hot Reload active (except schema.js)');
    watchPaths.filter(p => !p.startsWith('!')).forEach(p => {
        console.log(`   → ${path.relative(path.join(__dirname, '../'), p)}`);
    });

}

// Robust command parser
function extractCommand(message) {
    try {
        if (!message?.message) return { command: '', fulltext: '' };

        const text = message.message.conversation ||
        message.message.extendedTextMessage?.text || '';
        const fulltext = text.trim().replace(/^s*!/, '').replace(/s+/g, ' ');
        const command = fulltext.split(' ')[0].toLowerCase();

        return { command, fulltext };
    } catch (e) {
        console.warn('⚠️ Error extracting command:', e);
        return { command: '', fulltext: '' };
    }

}

// Group role checker with error handling
async function getGroupRoles(Bloom, jid, groupId) {
    try {
        if (!Bloom || !jid || !groupId) return { isAdmin: false, isSuperAdmin: false };

        const metadata = await Bloom.groupMetadata(groupId);
        const participant = metadata.participants.find(p => p.id === jid);

        return {
            isAdmin: participant?.admin === 'admin',
            isSuperAdmin: participant?.admin === 'superadmin',
        };
    } catch (e) {
        console.warn('⚠️ Error checking group roles:', e);
        return { isAdmin: false, isSuperAdmin: false };
    }

}

async function getBotRoles(Bloom, groupId) {
    try {
        if (!Bloom?.user?.id || !groupId) return { isAdmin: false, isSuperAdmin: false };
        const botJid = Bloom.user.id.split(':')[0] + '@s.whatsapp.net';
        return await getGroupRoles(Bloom, botJid, groupId);
    } catch (e) {
        console.warn('⚠️ Error checking bot roles:', e);
        return { isAdmin: false, isSuperAdmin: false };
    }
}

// Mode check with proper validation
async function checkMode(Bloom, message) {
    try {
        if (!Bloom || !message?.key) return false;

        const sender = message.key.participant || message.key.remoteJid;
        if (!sender) return false;

        const isGroup = message.key.remoteJid?.endsWith('@g.us') || false;
        const { command } = extractCommand(message);

        if (!command || !commandRegistry[command]) return true;

        if (mode === 'public') return true;

        if (mode === 'private') {
            if (sender === sudochat) return true;

            let user = await UserCounter.findOne({ user: sender });
            if (!user) user = await UserCounter.create({ user: sender, count: 1 });
            else user.count += 1;

            if (user.count >= 3) {
                await Bloom.sendMessage(sender, { text: mess.blocked });
                await Bloom.updateBlockStatus(sender, 'block');
                return false;
            }

            await user.save();
            await Bloom.sendMessage(sender, { text: mess.privateMode });
            return false;
        }

        if (mode === 'group' && (!isGroup && sender !== sudochat)) {
            await Bloom.sendMessage(sender, { text: mess.groupOnly });
            return false;
        }

        return true;
    } catch (e) {
        console.error('❌ Error in checkMode:', e);
        return false;
    }

}

// Anti-link / no-image with safety checks
async function checkMessageType(Bloom, message) {
    try {
        if (!Bloom || !message?.key) return true;


        const groupId = message.key.remoteJid;
        if (!groupId?.endsWith('@g.us')) return true;

        const settings = await Settings.findOne({ group: groupId });
        if (!settings) return true;

        const sender = message.key.participant;
        if (!sender) return true;

        const { isAdmin: senderIsAdmin } = await getGroupRoles(Bloom, sender, groupId);
        const { isAdmin: botIsAdmin } = await getBotRoles(Bloom, groupId);

        const text = message.message?.conversation ||
        message.message?.extendedTextMessage?.text || '';

        if (settings.antiLink && text.includes('http') && !senderIsAdmin) {
            if (botIsAdmin) {
                await Bloom.groupParticipantsUpdate(groupId, [sender], 'remove');
            }
            return false;
        }

        const hasImage = !!message.message?.imageMessage;
        if (settings.noImage && hasImage && !senderIsAdmin) {
            settings.warns = settings.warns || {};
            settings.warns[sender] = (settings.warns[sender] || 0) + 1;

            if (settings.warns[sender] >= 2 && botIsAdmin) {
                await Bloom.groupParticipantsUpdate(groupId, [sender], 'remove');
                delete settings.warns[sender];
            } else {
                await Bloom.sendMessage(groupId, {
                    text: `⚠️ @${sender.split('@')[0]}, images are not allowed here.`,
                                        mentions: [sender]
                });
            }

            await settings.save();
            return false;
        }

        return true;
    } catch (e) {
        console.error('❌ Error in checkMessageType:', e);
        return true;
    }


}

// NSFW/Game toggle with validation
async function checkCommandTypeFlags(Bloom, message) {
    try {
        if (!Bloom || !message?.key) return true;

        const groupId = message.key.remoteJid;
        if (!groupId?.endsWith('@g.us')) return true;

        const { command } = extractCommand(message);
        if (!command || !commandRegistry[command]) return true;

        const cmdData = commandRegistry[command];
        if (!cmdData) return true;

        const settings = await Settings.findOne({ group: groupId });
        if (!settings) return true;

        if (cmdData.type === 'game' && !settings.gameEnabled) {
            await Bloom.sendMessage(groupId, { text: '🎮 Games are disabled in this group.' });
            return false;
        }

        if (cmdData.type === 'nsfw' && !settings.nsfwEnabled) {
            await Bloom.sendMessage(groupId, { text: '🔞 NSFW is disabled in this group.' });
            return false;
        }

        return true;
    } catch (e) {
        console.error('❌ Error in checkCommandTypeFlags:', e);
        return true;
    }
}
// AFK check with safety
async function checkAFK(Bloom, message) {
    try {
        if (!Bloom || !message?.key || !message.message?.extendedTextMessage?.contextInfo) {
            return true;
        }

        const quotedUser = message.message.extendedTextMessage.contextInfo.participant;
        if (!quotedUser) return true;

        const afk = await AFK.findOne({ user: quotedUser });
        if (afk) {
            await Bloom.sendMessage(message.key.remoteJid, {
                text: `💤 That user is AFK: ${afk.reason || 'No reason'}`,
                mentions: [quotedUser]
            });
            return false;
        }

        return true;
    } catch (e) {
        console.error('❌ Error in checkAFK:', e);
        return true;
    }

}

// Main command handler
const bloomCmd = async (Bloom, message) => {
    try {
        if (!Bloom || !message?.key) {
            console.warn('⚠️ Invalid message received');
            return false;
        }

        // Initialize if not already done
        if (!activeBloomInstance) {
            await initCommandHandler(Bloom);
        }

        // Extract command text first
        const { command, fulltext } = extractCommand(message);

        // FIRST - Check if it's a number 1-9 and handle immediately
        if (/^[1-9]$/.test(command)) {
            await tttmove(Bloom, message, fulltext);
            return true; // Exit after handling TTT move
        }

        // Rest remains exactly the same
        const checks = [
            () => checkMode(Bloom, message),
            () => checkMessageType(Bloom, message),
            () => checkCommandTypeFlags(Bloom, message),
            () => checkAFK(Bloom, message)
        ];

        let shouldProceed = true;
        for (const check of checks) {
            try {
                shouldProceed = shouldProceed && await check();
                if (!shouldProceed) break;
            } catch (e) {
                console.error(`❌ Error running check:`, e);
                shouldProceed = false;
                break;
            }
        }

        if (shouldProceed && command && commandRegistry[command]) {
            await bloomCm(Bloom, message, fulltext, commandRegistry);
        }

        return shouldProceed;
    } catch (e) {
        console.error('❌ Critical error:', e);
        return false;
    }
};

// Initialize at the bottom (before exports)
if (node !== 'production') {
    setupHotReload();
}

module.exports = {
    bloomCmd,
    initCommandHandler,
    commands: commandRegistry,
    getGroupRoles,
    getBotRoles
};
