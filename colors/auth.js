// colors/auth.js
const { get } = require('./setup');
const mess = require('./mess');
const fs = require('fs').promises;
const path = require('path');

const safeGet = async (key) => {
    try {
        const val = await get(key);
        return val ? normalizeId(val) : null;
    } catch (err) {
        console.error(`[AUTH] get(${key}) failed:`, err);
        return null;
    }
};


const log = (...a) => console.log('[AUTH]', ...a);

let BOT_JID = null;
let BOT_LID = null;

/** -----------------------------
 * Load creds from saved storage
 * ----------------------------- */
const loadCreds = async () => {
    try {
        const file = path.join(__dirname, '../heart/creds.json');
        const raw = await fs.readFile(file, 'utf8');
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

/** -----------------------------
 * Helper: Normalize WhatsApp IDs
 * ----------------------------- */
const normalizeId = jid => {
    if (!jid) return null;
    jid = jid.split(':')[0];
    return jid.includes('@') ? jid : `${jid}@s.whatsapp.net`;
};

/** -----------------------------
 * Initialize BOT_JID & BOT_LID
 * ----------------------------- */
const initBotId = async Bloom => {
    const creds = await loadCreds();

    if (creds?.me) {
        BOT_JID = normalizeId(creds.me.id);
        BOT_LID = normalizeId(creds.me.lid)?.replace('@s.whatsapp.net', '@lid');
    } else {
        BOT_JID = normalizeId(Bloom.user?.id);
        BOT_LID = Bloom.me?.lid
            ? normalizeId(Bloom.me.lid)?.replace('@s.whatsapp.net', '@lid')
            : BOT_JID.replace('@s.whatsapp.net', '@lid');
    }

    log('Initialized Bot ID:', BOT_JID, BOT_LID);
};

/** -----------------------------
 * Compare IDs ignoring device tags
 * ----------------------------- */
const idsMatch = (a, b) => {
    if (!a || !b) return false;

    const A = a.split('@')[0].split(':')[0];
    const B = b.split('@')[0].split(':')[0];

    return A === B;
};

/** -----------------------------
 * Fetch Metadata
 * ----------------------------- */
const fetchGroupMetadata = async (Bloom, message) => {
    const gid = message.key.remoteJid;

    if (!gid.endsWith('@g.us')) {
        await Bloom.sendMessage(gid, { text: mess.group });
        return null;
    }

    try {
        return await Bloom.groupMetadata(gid);
    } catch (e) {
        await Bloom.sendMessage(gid, { text: mess.gmetafail });
        return null;
    }
};

/** -----------------------------
 * Is the bot admin?
 * ----------------------------- */
const isBotAdmin = async (Bloom, message) => {
    const meta = await fetchGroupMetadata(Bloom, message);
    if (!meta) return false;

    const bot = meta.participants.find(
        p => idsMatch(p.id, BOT_JID) || (BOT_LID && idsMatch(p.id, BOT_LID))
    );

    return ['admin', 'superadmin'].includes(bot?.admin);
};

/** -----------------------------
 * Is the sender admin?
 * ----------------------------- */
const isSenderAdmin = async (Bloom, message) => {
    const meta = await fetchGroupMetadata(Bloom, message);
    if (!meta) return false;

    const sender = message.key.participant || message.participant;
    const entry = meta.participants.find(p => idsMatch(p.id, sender));

    return ['admin', 'superadmin'].includes(entry?.admin);
};

/** -----------------------------
 * KING: Owner/Sudo check
 * ----------------------------- */
const isBloomKing = async (sender, message) => {
    const id = sender.endsWith('@g.us') ? message.key.participant : sender;

    const sudochat = await safeGet('OWNERNUMBER'); // normalized or null
    let sudolid = await get('SUDOLID');
    if (sudolid) sudolid = sudolid.replace('@s.whatsapp.net', '@lid');

    const match =
        (sudochat && idsMatch(id, sudochat)) ||
        (sudolid && idsMatch(id, sudolid));

    log('[AUTH] King Check:', id, '=>', match);
    return !!match; // ensure boolean
};


/** -----------------------------
 * Combined Group Admin Context
 * ----------------------------- */
const isGroupAdminContext = async (Bloom, message) => {
    if (!BOT_JID) await initBotId(Bloom);

    const meta = await fetchGroupMetadata(Bloom, message);
    if (!meta) return false;

    const sender = message.key.participant || message.participant;

    const bot = meta.participants.find(
        p => idsMatch(p.id, BOT_JID) || (BOT_LID && idsMatch(p.id, BOT_LID))
    );

    const user = meta.participants.find(p => idsMatch(p.id, sender));

    const botAdmin = ['admin', 'superadmin'].includes(bot?.admin);
    const userAdmin = ['admin', 'superadmin'].includes(user?.admin);

    if (!botAdmin) {
        await Bloom.sendMessage(message.key.remoteJid, { text: mess.botadmin });
    }

    if (!userAdmin) {
        await Bloom.sendMessage(message.key.remoteJid, { text: mess.youadmin });
    }

    return botAdmin && userAdmin;
};

/** -----------------------------
 * EXPORTS
 * ----------------------------- */
module.exports = {
    fetchGroupMetadata, isBotAdmin,
    isSenderAdmin, isBloomKing,     // async safe version
    isGroupAdminContext,
    initBotId: async Bloom => initBotId(Bloom)
};