const mongoose = require('mongoose');
const { Settings, UserCounter, AFK, connectDB } = require('../colors/schema');
const mess = require('../colors/mess');
const { isSenderAdmin, isBotAdmin } = require('../colors/auth');
const { node, sudochat, mode } = require('../colors/setup');
const { trackUsage } = require('../colors/exp');
const { tttmove,startReminderChecker } = require('./ttthandle');
const fs = require('fs'), path = require('path');

connectDB('Brain Module');
let commandRegistry = {}, activeLunaInstance = null;

async function initCommandHandler(Luna) { activeLunaInstance = Luna; commandRegistry = {}; await loadCommands(); console.log('♻️ Command handler initialized'); }

async function loadCommands() {
    try { const currentDir = __dirname;
        const subdirs = fs.readdirSync(currentDir).filter(file => { try { return fs.statSync(path.join(currentDir, file)).isDirectory(); } catch (e) { return false; } });
        for (const dir of subdirs) {
            try {
                const files = fs.readdirSync(path.join(currentDir, dir));
                for (const file of files) {
                    if (file.endsWith('.js') && !file.startsWith('_')) {
                    try { const modulePath = path.join(currentDir, dir, file);
                            delete require.cache[require.resolve(modulePath)];
                            const module = require(modulePath);
                            for (const [cmd, data] of Object.entries(module)) {
                                if (cmd.startsWith('_')) continue;
                                if (typeof data?.run === 'function') commandRegistry[cmd] = data;
                            } } catch (err) { } } } } catch (e) { } }
console.log(`📦 Total loaded commands: ${Object.keys(commandRegistry).length}`); } catch (e) { } }

async function bloomCm(Luna, message, fulltext, commands) {
    const senderJid = message.key?.participant || message.key?.remoteJid;
    if (senderJid) await trackUsage(senderJid);

    let commandName = fulltext.split(' ')[0].toLowerCase();
    const commandModule = commands[commandName];
    if (!commandModule || typeof commandModule.run !== 'function') return;

    try {
        await commandModule.run(Luna, message, fulltext, commands);
    } catch (err) {
        console.error(`❌ Fatal error: Command "${commandName}" failed:`, err);
        await Luna.sendMessage(message.key.remoteJid, {
            text: '❗ An error occurred while executing the command.' });  } }

function setupHotReload() {
    if (node === 'production') return;
    const commandDirs = fs.readdirSync(__dirname).filter(file => { try { return fs.statSync(path.join(__dirname, file)).isDirectory() && !file.startsWith('_') && file !== 'colors'; } catch (e) { return false; } });
    commandDirs.forEach(dir => { const dirPath = path.join(__dirname, dir);
        fs.watch(dirPath, { recursive: false }, (eventType, filename) => { if (!filename || !filename.endsWith('.js')) return; reloadFile(path.join(dirPath, filename)); }); });
    fs.watch(__dirname, { recursive: false }, (eventType, filename) => { if (!filename || !filename.endsWith('.js') || filename === 'brain.js' || filename.startsWith('_')) return; reloadFile(path.join(__dirname, filename)); });
    async function reloadFile(filePath) {
        try { delete require.cache[require.resolve(filePath)]; require(filePath); if (!filePath.includes('colors')) await loadCommands(); }
        catch (err) { } } }

const bloomCmd = async (Luna, message) => {
    try {
        if (!Luna || !message?.key) return false;
        if (!activeLunaInstance) await initCommandHandler(Luna);
         if (message.key.remoteJid === 'status@broadcast') { return false; }

        const { command, fulltext } = extractCommand(message);
        if (/^[1-9]$/.test(command)) { await tttmove(Luna, message, fulltext); return true; }

        const checks = [
            () => checkMode(Luna, message), () => checkGroupCommandLock(Luna, message), () => checkMessageType(Luna, message),
            () => checkCommandTypeFlags(Luna, message), () => checkAFK(Luna, message),
        ];
        let shouldProceed = true;
        for (const [i, check] of checks.entries()) {
            try {
                const result = await check();
                shouldProceed = shouldProceed && result;
                if (!shouldProceed) break;
            } catch (e) {
                shouldProceed = false;  break; }  }

        if (shouldProceed && command && commandRegistry[command]) {
            await bloomCm(Luna, message, fulltext, commandRegistry);
        }   return shouldProceed;  } catch (e) {  return false;  } };

function extractTextFromMessage(msg) {
    if (!msg) return '';
    if (msg.conversation) return msg.conversation;
    if (msg.extendedTextMessage && msg.extendedTextMessage.text) return msg.extendedTextMessage.text;
    if (msg.ephemeralMessage) return extractTextFromMessage(msg.ephemeralMessage.message);
    if (msg.viewOnceMessage) return extractTextFromMessage(msg.viewOnceMessage.message);
    // Add more cases as needed for other message types
    return '';
}

function extractCommand(message) {
    try {
        if (!message?.message) return { command: '', fulltext: '' };
        const text = extractTextFromMessage(message.message);
        const fulltext = text.trim().replace(/^\s*!/, '').replace(/\s+/g, ' ');
        const command = fulltext.split(' ')[0].toLowerCase();
        return { command, fulltext };
    } catch (e) { return { command: '', fulltext: '' }; } }

async function checkMode(Luna, message) {
    try {
        if (!Luna || !message?.key) return false;
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
                await Luna.sendMessage(sender, { text: mess.blocked });
                await Luna.updateBlockStatus(sender, 'block');  return false;
            }
            await user.save();
            await Luna.sendMessage(sender, { text: mess.privateMode });
            return false;  }

        if (mode === 'group' && (!isGroup && sender !== sudochat)) {
            await Luna.sendMessage(sender, { text: mess.groupOnly });
            return false;  } return true; } catch (e) { return false; } }

async function checkMessageType(Luna, message) {
    try {
        if (!Luna || !message?.key || !message.message) return true;
        const groupId = message.key.remoteJid;
        if (!groupId?.endsWith('@g.us')) return true;
        const sender = message.key.participant;
        if (!sender) return true;
        const settings = await Settings.findOne({ group: groupId });
        if (!settings) return true;
        const senderIsAdmin = await isSenderAdmin(Luna,message);
        const botIsAdmin = await isBotAdmin(Luna,message);
        const messageType = Object.keys(message.message)[0] || '';
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const linkRegex = /(?:https?:\/\/|www\.)[^\s]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?/gi;
        if (settings.antiLink && !senderIsAdmin) {
            const matches = text.match(linkRegex);
            if (matches && matches.length > 0) {
                if (botIsAdmin) await Luna.groupParticipantsUpdate(groupId, [sender], 'remove');
                return false;  } }

        if (settings.noImage && messageType === 'imageMessage' && !senderIsAdmin) {
            if (!(settings.warns instanceof Map)) settings.warns = new Map(Object.entries(settings.warns || {}));
            const safeSender = sender.replace(/\./g, '(dot)');
            const currentWarn = settings.warns.get(safeSender) || 0, newWarn = currentWarn + 1;
            settings.warns.set(safeSender, newWarn);
            if (newWarn >= 3) {
                if (botIsAdmin) await Luna.groupParticipantsUpdate(groupId, [sender], 'remove');
                settings.warns.delete(safeSender);
                await settings.save();
                return false;
            }
            await Luna.sendMessage(groupId, { text: `⚠️ @${sender.split('@')[0]}, no images allowed! Warning ${newWarn}/3.`, mentions: [sender] });
            await settings.save(); }  return true;  } catch (err) { return true; } }

async function checkCommandTypeFlags(Luna, message) {
    try {
        if (!Luna || !message?.key) return true;
        const groupId = message.key.remoteJid;
        if (!groupId?.endsWith('@g.us')) return true;
        const { command } = extractCommand(message);
        if (!command || !commandRegistry[command]) return true;
        const cmdData = commandRegistry[command];
        if (!cmdData) return true;
        const settings = await Settings.findOne({ group: groupId });
        if (!settings) return true;
        if (cmdData.type === 'game' && !settings.gameEnabled) { await Luna.sendMessage(groupId, { text: mess.games }); return false; }
        if (cmdData.type === 'nsfw' && !settings.nsfwEnabled) { await Luna.sendMessage(groupId, { text: mess.nsfwoff }); return false; }
        return true;   } catch (e) { return true; } }

async function checkGroupCommandLock(Luna, message) {
    try {
        if (!Luna || !message?.key) return true;
        const groupId = message.key.remoteJid;
        if (!groupId?.endsWith('@g.us')) return true;

        const { command } = extractCommand(message);
        if (!command || !commandRegistry[command]) return true;

        const settings = await Settings.findOne({ group: groupId });
        if (!settings) return true;

        const overrideCommand = 'cmds';
        if (!settings.commandsEnabled && command !== overrideCommand) {
        //    await Luna.sendMessage(groupId, { text: '🚫 Commands are currently disabled in this group by an admin.' });
            return false;  }  return true;  } catch (err) {  return true;  } }

async function checkAFK(Luna, message) {
    try {
        if (!Luna || !message?.key || !message.message?.extendedTextMessage?.contextInfo) return true;
        const quotedUser = message.message.extendedTextMessage.contextInfo.participant;
        if (!quotedUser) return true;
        const afk = await AFK.findOne({ user: quotedUser });
        if (afk) {
            await Luna.sendMessage(message.key.remoteJid, { text: `💤 That user is AFK: ${afk.reason || 'No reason'}`, mentions: [quotedUser] });
            return false; }  return true;  } catch (e) { return true; } }

if (node !== 'production') setupHotReload();
module.exports = { bloomCmd, initCommandHandler, commands: commandRegistry,startReminderChecker };