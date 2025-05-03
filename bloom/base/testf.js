module.exports = {
    testf: {
        type: 'fun',
        desc: 'A fun testing command',
        run: async (Bloom, message, fulltext) => {
            console.log("📨 Executing testf...");
            await Bloom.sendMessage(message.key.remoteJid, { text: "Test passed!" });
        }
    }
};