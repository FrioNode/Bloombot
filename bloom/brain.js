const mongoose = require('mongoose');
const { Settings, UserCounter, AFK } = require('../colors/schema');
const { mongo, node, sudochat, mode, _reload } = require('../colors/setup'); _reload();
const mess = require('../colors/mess');
const { trackUsage } = require('../colors/exp');
const { tttmove } = require('./tttmove');
const options = { serverSelectionTimeoutMS: 30000, socketTimeoutMS: 45000 };
const fs = require('fs');
const path = require('path');

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

    console.log('⚡ Initializing hot reload (fs.watch)...');

    // 1. Get all command directories
    const commandDirs = fs.readdirSync(__dirname)
    .filter(file => {
        try {
            return fs.statSync(path.join(__dirname, file)).isDirectory() &&
            !file.startsWith('_') &&
            file !== 'colors';
        } catch (e) {
            return false;
        }
    });

    // 2. Watch each directory
    commandDirs.forEach(dir => {
        const dirPath = path.join(__dirname, dir);

        fs.watch(dirPath, { recursive: false }, (eventType, filename) => {
            if (!filename || !filename.endsWith('.js')) return;

            const filePath = path.join(dirPath, filename);
            console.log(`\n📡 ${eventType} detected: ${path.join(dir, filename)}`);

            reloadFile(filePath);
        });
    });

    // 3. Watch root directory
    fs.watch(__dirname, { recursive: false }, (eventType, filename) => {
        if (!filename || !filename.endsWith('.js') ||
            filename === 'brain.js' ||
            filename.startsWith('_')) return;

        const filePath = path.join(__dirname, filename);
        console.log(`\n📡 ${eventType} detected: ${filename}`);
        reloadFile(filePath);
    });

    async function reloadFile(filePath) {
        try {
            // Clear cache
            delete require.cache[require.resolve(filePath)];

            // Reload module
            require(filePath);
            console.log(`♻️ Reloaded: ${path.relative(__dirname, filePath)}`);

            // Refresh commands
            if (!filePath.includes('colors')) {
                await loadCommands();
                console.log('🔄 Command registry updated');
            }
        } catch (err) {
            console.error(`❌ Reload failed: ${err.message}`);
        }
    }

    console.log('✅ Hot reload active for:');
    commandDirs.forEach(dir => console.log(`   → ${dir}/*.js`));
    console.log('   → *.js (root)');
}
// Robust command parser
function extractCommand(message) {
    try {
        if (!message?.message) return { command: '', fulltext: '' };

        const text = message.message.conversation ||
        message.message.extendedTextMessage?.text || '';
        const fulltext = text.trim().replace(/^\s*!/, '').replace(/\s+/g, ' ');
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
        if (!Bloom || !message?.key || !message.message) return true;

        const groupId = message.key.remoteJid;
        if (!groupId?.endsWith('@g.us')) return true;

        const sender = message.key.participant;
        if (!sender) return true;

        const settings = await Settings.findOne({ group: groupId });
        if (!settings) return true;

        const { isAdmin: senderIsAdmin } = await getGroupRoles(Bloom, sender, groupId);
        const { isAdmin: botIsAdmin } = await getBotRoles(Bloom, groupId);

        const messageType = Object.keys(message.message)[0] || '';
        const text = message.message?.conversation ||
        message.message?.extendedTextMessage?.text || '';

        // --- ANTI LINK ---
        // Matches most common links (with or without protocol)
        const linkRegex = /(?:https?:\/\/|www\.)[^\s]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?/gi;
        if (settings.antiLink && !senderIsAdmin) {
            const matches = text.match(linkRegex);
            if (matches && matches.length > 0) {
                if (botIsAdmin) {
                    await Bloom.groupParticipantsUpdate(groupId, [sender], 'remove');
                }
                return false; // Block command execution
            }
        }

        // --- NO IMAGE ---
        if (settings.noImage && messageType === 'imageMessage' && !senderIsAdmin) {
            if (!(settings.warns instanceof Map)) {
                settings.warns = new Map(Object.entries(settings.warns || {}));
            }

            const safeSender = sender.replace(/\./g, '(dot)');
            const currentWarn = settings.warns.get(safeSender) || 0;
            const newWarn = currentWarn + 1;

            settings.warns.set(safeSender, newWarn);

            if (newWarn >= 3) {
                if (botIsAdmin) {
                    await Bloom.groupParticipantsUpdate(groupId, [sender], 'remove');
                }
                settings.warns.delete(safeSender);
                await settings.save();
                return false; // Block further handling
            }

            // Warn user but ALLOW command handling
            await Bloom.sendMessage(groupId, {
                text: `⚠️ @${sender.split('@')[0]}, no images allowed! Warning ${newWarn}/3.`,
                                    mentions: [sender]
            });

            await settings.save();
        }

        return true; // ✅ Let the command proceed

    } catch (err) {
        console.error('❌ checkMessageType error:', err);
        return true; // Fallback: allow command in case of error
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

if (node !== 'production') {
    setupHotReload();
}
module.exports = {  bloomCmd, initCommandHandler, commands: commandRegistry, getGroupRoles, getBotRoles };