const { sudoChat } = require("./setup");
const fetchGroupMetadata = async (Bloom, message) => {
    const groupId = message.key.remoteJid;
    if (!groupId.endsWith('@g.us')) return null;

    try {
        return await Bloom.groupMetadata(groupId);
    } catch (err) {
        console.error('Error fetching group metadata:', err);
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
    return sender === sudoChat;
};

const isGroupAdminContext = async (Bloom, message) => {
    return (await isBotAdmin(Bloom, message)) && (await isSenderAdmin(Bloom, message));
};

module.exports = {
    fetchGroupMetadata,
    isBotAdmin,
    isSenderAdmin,
    isBloomKing,
    isGroupAdminContext
};