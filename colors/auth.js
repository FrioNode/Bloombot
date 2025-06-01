const { sudochat, _reload } = require('./setup'); _reload();
const mess = require('./mess');
const fs = require('fs').promises;
const path = require('path');

// ID Utilities
let BOT_JID;
let BOT_LID;

const loadCreds = async () => {
    try {
        const credsPath = path.join(__dirname, '../heart/creds.json');
        const data = await fs.readFile(credsPath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return null;
    }
};

const normalizeId = (jid) => {
    if (!jid) return jid;
    jid = jid.split(':')[0];
    return jid.includes('@') ? jid : `${jid}@s.whatsapp.net`;
};

const initBotId = async (Bloom) => {
    const creds = await loadCreds();

    if (creds?.me) {
        BOT_JID = normalizeId(creds.me.id);
        BOT_LID = normalizeId(creds.me.lid).replace('@s.whatsapp.net', '@lid');
    } else {
        BOT_JID = normalizeId(Bloom.user?.id);
        BOT_LID = Bloom.me?.lid
        ? normalizeId(Bloom.me.lid).replace('@s.whatsapp.net', '@lid')
        : BOT_JID.replace('@s.whatsapp.net', '@lid');
    }
};

const idsMatch = (a, b) => {
    if (!a || !b) return false;
    return a.split('@')[0].split(':')[0] === b.split('@')[0].split(':')[0];
};

const fetchGroupMetadata = async (Bloom, message) => {
    const groupId = message.key.remoteJid;
    if (!groupId.endsWith('@g.us')) {
        await Bloom.sendMessage(groupId, { text: mess.group });
        return null;
    }

    try {
        return await Bloom.groupMetadata(groupId);
    } catch {
        await Bloom.sendMessage(groupId, { text: mess.gmetafail });
        return null;
    }
};

const isBotAdmin = async (Bloom, message) => {
    const metadata = await fetchGroupMetadata(Bloom, message);
    if (!metadata) return false;

    const botMatch = metadata.participants.find(p =>
    idsMatch(p.id, BOT_JID) || (BOT_LID && idsMatch(p.id, BOT_LID))
    );
    return ['admin', 'superadmin'].includes(botMatch?.admin);
};

const isSenderAdmin = async (Bloom, message) => {
    const metadata = await fetchGroupMetadata(Bloom, message);
    if (!metadata) return false;

    const senderId = message.key.participant || message.participant;
    if (!senderId) return false;

    const senderMatch = metadata.participants.find(p => idsMatch(p.id, senderId));
    return ['admin', 'superadmin'].includes(senderMatch?.admin);
};

const isBloomKing = (sender, message) => {
    const checkId = sender.endsWith('@g.us') ? message.key.participant : sender;
    return idsMatch(checkId, sudochat);
};

const isGroupAdminContext = async (Bloom, message) => {
    if (!BOT_JID) await initBotId(Bloom);

    const metadata = await fetchGroupMetadata(Bloom, message);
    if (!metadata) return false;

    const senderId = message.key.participant || message.participant;
    const botParticipant = metadata.participants.find(p =>
    idsMatch(p.id, BOT_JID) || (BOT_LID && idsMatch(p.id, BOT_LID))
    );
    const senderParticipant = metadata.participants.find(p => idsMatch(p.id, senderId));

    const botAdmin = ['admin', 'superadmin'].includes(botParticipant?.admin);
    const senderAdmin = ['admin', 'superadmin'].includes(senderParticipant?.admin);

    if (!botAdmin) await Bloom.sendMessage(message.key.remoteJid, { text: mess.botadmin });
    if (!senderAdmin) await Bloom.sendMessage(message.key.remoteJid, { text: mess.youadmin });

    return botAdmin && senderAdmin;
};

module.exports = {
    fetchGroupMetadata,
    isBotAdmin,
    isSenderAdmin,
    isBloomKing,
    isGroupAdminContext,
    initBotId: async (Bloom) => { await initBotId(Bloom); }
};