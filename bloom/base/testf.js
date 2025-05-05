module.exports = {
    testf: {
        type: 'user',
        desc: 'A user testing command',
        usage: 'testf',
        run: async (Bloom, message, fulltext) => {
            console.log("📨 Executing testf...");
            await Bloom.sendMessage(message.key.remoteJid, { text: "Test passed!" });
        }
    }
};