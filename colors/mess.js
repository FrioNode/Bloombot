// project/colors/mess.js
const { get } = require('./setup');
const bloom = require('../package.json');

let state = {
    botname: 'Luna',
    emoji: '🌼',
    ownername: 'Benson',
    devname: 'FrioNode',
    cpyear: new Date().getFullYear(),
    mode: 'group',
};

// Main container for messages
const mess = {};

// Build message object based on current state
function buildMessages() {
    mess.about = `_Hi, I am ${state.botname} ${state.emoji}_\n> A WhatsApp multidevice AI written in JavaScript based on Baileys. I was developed by Master ${state.ownername} and LICENSED under ISC licensing policy at ColdNode Labs (Naivasha, Kenya). I am one of the most advanced AI user-bot models with more than 400 features. Check more from my developer on: https://github.com/(${state.devname})\n\n${state.emoji} To open a ticket send: *(ticket)*`;

    mess.ticket = `Your ticket has been created successfully.\n_${state.devname} will contact you shortly. Meanwhile check *(menu)*_`;

    mess.bloom = `╭────${state.emoji} ${state.botname} ─────
│   > Version: ${bloom.version} LTS
│   > Global theme: ${state.botname}
│    _A reason to imagine_
│    _Operating mode: ${state.mode}_
╰─────────────────
> (c) ${state.cpyear} ${state.botname} By @${state.devname} - ☁️ •|•`;

    mess.powered = `Powered By ${state.devname}`;
    mess.admin = "_This command is meant for group admins only!_";
    mess.owner = `This command is meant for ${state.botname} owner only!`;
    mess.autorestart = `${state.botname} will restart automatically to apply changes.`;
    mess.manualrestart = `You need to restart ${state.botname} manually.`;
    mess.norestart = `_🚫 Only ${state.botname} owner can restart bot_`;
    mess.shut = `Shutting down.... You will need to start ${state.botname} manually!`;
    mess.noshut = `Unauthorized`;

    mess.ping = "_Response time:_";
    mess.pong = "_Pong!_";
    mess.search = "_Searching for results..._";
    mess.nosearch = "_No matching content found_";
    mess.broadcast = "_Broadcast sent successfully_";

    mess.restarting = `╭────────────────────
│> *🔁 Restarting ${state.emoji} ${state.botname}....*
│ _I will notify you once online_
│ Restart manually if something fails.
╰────────────────────── 🚀`;

    mess.group = "_This command can only be used in group chats._";
    mess.agenda = `_Only ${state.botname} owner can do that in a group_`;
    mess.ticketarg = `Please write your issue or ticket ID\nExample:\nticket something is not ok\nticket BB-0000A`;
    mess.noarg = `Provide arguments! Command incomplete.`;
    mess.limited = `⚠️ Maximum 3 open tickets.`;
    mess.gmetafail = "❌ Failed to fetch group metadata";
    mess.botadmin = `_${state.botname} must be admin first!_`;
    mess.youadmin = "_You are not an admin!_";
    mess.wenot = "❌ Neither you nor I am admin.";

    mess.nsfwoff = `_NSFW not enabled!_\nUse *nsfw on*`;
    mess.nsfwon = `_NSFW already enabled!_\nUse *nsfw off* to activate nsfw`;
    mess.games = `_Games are disabled!_\nUse *games on* to activate games`;

    mess.deact = `_Second parameter required!\n> deact (economy,games,nsfw,welcome,left)`;

    mess.add = `_To add a user:\nadd 2547xxxxxxx_`;
    mess.joinlink = `_Need a group link or code_\njoin link_here`;

    mess.error404 = `_Command not found!_\nTry menu`;
    mess.error = `An error occurred..!`;
    mess.bug = "*An error occurred..!*\nReport sent.";

    mess.not_a_repo = '❌ Not a Git repo.';
    mess.no_updates = '✅ Up to date!';
    mess.pull_success = '✅ Updated successfully!';
    mess.pull_failed = '❌ Git pull failed!';
    mess.restart_later = '⏰ Restart cancelled.';
    mess.restarting_now = '♻️ Restarting bot...';
    mess.restart_failed = '❌ Restart failed!';
    mess.installing_dependencies = '📦 Installing dependencies...';
    mess.install_failed = '❌ Dependency install failed!';

    mess.privateMode = `Bot in private mode — do not disturb`;
    mess.blocked = `You will be blocked for violating privacy policy`;
    mess.groupOnly = `Bot set to group-only mode`;

    mess.footer = `(c) ${state.cpyear} ${state.botname} By @${state.devname} - ☁️ •|•`;
}

// Load from DB and rebuild messages
async function initMess() {
    state.botname = await get('BOTNAME') || state.botname;
    state.emoji = await get('EMOJI') || state.emoji;
    state.ownername = await get('OWNERNAME') || state.ownername;
    state.devname = await get('DEVNAME') || state.devname;
    state.cpyear = await get('CPYEAR') || state.cpyear;
    state.mode = await get('MODE') || state.mode;

    buildMessages();
}

// Support hot reload — called by watcher
async function reload() {
    await initMess();
}

initMess(); // Run on module load

module.exports = { mess, reload, initMess };