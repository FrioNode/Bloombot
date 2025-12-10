const { get } = require('./setup');
const bloom = require('../package.json');

let botname = 'Luna';
let emoji = '🌼';
let ownername = 'Benson';
let prefix = '!';
let devname = 'FrioNode';
let cpyear = new Date().getFullYear();
let mode = 'group';

// This object will be updated later once config loads from Mongo
let mess = {};

// Async initializer — runs once but does NOT block require()
async function initMess() {
    botname = await get('BOTNAME') || botname;
    emoji = await get('EMOJI') || emoji;
    ownername = await get('OWNERNAME') || ownername;
    prefix = await get('PREFIX') || prefix;
    devname = await get('DEVNAME') || devname;
    cpyear = await get('CPYEAR') || cpyear;
    mode = await get('MODE') || mode;

    mess = {
        about: `_Hi, I am ${botname} ${emoji}_\n> A WhatsApp multidevice AI written in JavaScript based on Baileys. I was developed by Master ${ownername} and LICENSED under ISC licensing policy at ColdNode Labs (Naivasha, Kenya). I am one of the most advanced AI user-bot models with more than 400 features. Check my developer on GitHub (${devname}).\n\n${emoji} To open a ticket send: *(${prefix}ticket)*`,

        ticket: `Your ticket has been created successfully.\n_${devname} will contact you shortly. Meanwhile check (${prefix}menu)_`,

        bloom: `╭────${emoji} ${botname} ─────
│   > Version: ${bloom.version} beta
│   > Global prefix: ${prefix}
│    _A reason to imagine_
│    _Operating mode: ${mode}_
╰─────────────────
> (c) ${cpyear} ${botname} By @${devname} - ☁️ •|•`,

        powered: `Powered By ${devname}`,
        admin: "_This command is meant for group admins only!_",
        owner: `This Command is meant for ${botname} owner only!`,
        autorestart: `${botname} will restart automatically to apply changes.`,
        manualrestart: `You need to restart ${botname} manually.`,
        norestart: `_🚫 Only ${botname} owner can restart bot_`,
        shut: `Shutting down.... You will need to start ${botname} manually!`,
        noshut: `Unauthorized`,
        ping: "_Response time:_",
        pong: "_Pong!_",
        search: "_Searching for results..._",
        nosearch: "_No matching content found_",
        broadcast: "_Broadcast sent successfully_",

        restarting: `╭────────────────────
│> *🔁 Restarting ${emoji} ${botname}....*
│ _I will notify you once online_
│ Restart manually if something fails.
╰────────────────────── 🚀`,

        group: "_This command can only be used in group chats._",
        agenda: `_Only ${botname} owner can do that in a group_`,
        ticketarg: `Please write your issue or ticket ID\nExample:\n!ticket something is not ok\n!ticket BB-0000A`,
        noarg: `Provide arguments! Command incomplete.`,
        limited: `⚠️ Maximum 3 open tickets.`,
        gmetafail: "❌ Failed to fetch group metadata",
        botadmin: `_${botname} must be admin first!_`,
        youadmin: "_You are not an admin!_",
        wenot: "❌ Neither you nor I am admin.",
        nsfwoff: `_NSFW not enabled!\nUse *${prefix}nsfw on*`,
        nsfwon: `_NSFW already enabled! Use *${prefix}nsfw off*`,
        games: `_Games are disabled! Use *${prefix}act games*`,
        economy: `_Economy disabled! Use *${prefix}act economy*`,
        act: `_Second parameter required!\n> ${prefix}act (economy,games,nsfw,welcome,left)`,
        deact: `_Second parameter required!\n> ${prefix}deact (economy,games,nsfw,welcome,left)`,

        add: `_To add a user:\n${prefix}add 2547xxxxxxx_`,
        joinlink: `_Need a group link or code_\n${prefix}join link_here`,

        error404: `_Command not found!_\nTry ${prefix}menu`,
        error: `An error occurred..!`,
        bug: "*An error occurred..!*\nReport sent.",
        not_a_repo: '❌ Not a Git repo.',
        no_updates: '✅ Up to date!',
        pull_success: '✅ Updated successfully!',
        pull_failed: '❌ Git pull failed!',
        restart_later: '⏰ Restart cancelled.',
        restarting_now: '♻️ Restarting bot...',
        restart_failed: '❌ Restart failed!',
        installing_dependencies: '📦 Installing dependencies...',
        install_failed: '❌ Dependency install failed!',

        privateMode: `Bot in private mode — do not disturb`,
        blocked: `You will be blocked for violating privacy policy`,
        groupOnly: `Bot set to group-only mode`,

        footer: `> (c) ${cpyear} ${botname} By @${devname} - ☁️ •|•`,
    };
}

// Fire async initialization (not awaited)
initMess();

// Exported object will be filled later
module.exports = new Proxy({}, {
    get: (_, key) => mess[key],
});