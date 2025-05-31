const { sudochat, _reload } = require('./setup'); _reload();
const mess = require('./mess');
const fetchGroupMetadata = async (Bloom, message) => {
    const groupId = message.key.remoteJid;
    if (!groupId.endsWith('@g.us')) {
        await Bloom.sendMessage(message.key.remoteJid, { text: mess.group });
        return null;
    }

    try {
        return await Bloom.groupMetadata(groupId);
    } catch (err) {
        console.error('Error fetching group metadata:', err);
        await Bloom.sendMessage(message.key.remoteJid, { text: mess.gmetafail });
        return null;
    }
};

const isBotAdmin = async (Bloom, message) => {
    const metadata = await fetchGroupMetadata(Bloom, message);
    if (!metadata) return false;

    const botId = Bloom.user.id.split(':')[0] + '@s.whatsapp.net';
    return metadata.participants.some(p =>
    p.id === botId && (p.admin === 'admin' || p.admin === 'superadmin')
    );
};

const isSenderAdmin = async (Bloom, message) => {
    const metadata = await fetchGroupMetadata(Bloom, message);
    if (!metadata) return false;

    const senderId = message.key.participant || message.participant;
    return metadata.participants.some(p =>
    p.id === senderId && (p.admin === 'admin' || p.admin === 'superadmin')
    );
};

const isBloomKing = async (sender, message) => {
    if (sender.endsWith('@g.us')) sender = message.key.participant;
    return sender === sudochat;
};

const isGroupAdminContext = async (Bloom, message) => {
    const groupMetadata = await fetchGroupMetadata(Bloom, message);
    if (!groupMetadata) return false;

    const botAdmin = await isBotAdmin(Bloom, message);
    const senderAdmin = await isSenderAdmin(Bloom, message);

    if (!botAdmin && !senderAdmin) {
        await Bloom.sendMessage(message.key.remoteJid, {
            text: mess.wenot
        });
        return false;
    }

    if (!botAdmin) {
        await Bloom.sendMessage(message.key.remoteJid, {
            text: mess.botadmin
        });
        return false;
    }

    if (!senderAdmin) {
        await Bloom.sendMessage(message.key.remoteJid, {
            text: mess.youadmin
        });
        return false;
    }

    return true; // both are admins
};

module.exports = {
    fetchGroupMetadata,
    isBotAdmin,
    isSenderAdmin,
    isBloomKing,
    isGroupAdminContext
};