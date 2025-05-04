module.exports = {
    jid: {
        type: 'user',
        desc: 'Returns the group or user JID of the chat',
        run: async (Bloom, message) => {
            const jid = message.key.remoteJid;
            await Bloom.sendMessage(jid, { text: `🆔 Chat JID:\n\n${jid}` });
        }
    }
};