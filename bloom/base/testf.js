module.exports = {
    testf: async (Bloom, message, fulltext) => {
        console.log("📨 Executing testf...");
        console.log("JID:", message.key?.remoteJid);
        console.log("Message quoted?", Boolean(message));
        // console.log(Bloom);

        await Bloom.sendMessage(message.key.remoteJid, { text: "Test passed!" });
    }
};