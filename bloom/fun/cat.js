const fetch = require('node-fetch');
module.exports = {
    cat: {
        type: 'fun',
        desc: 'Sends a random cat fact from the internet',
        run: async (Bloom, message) => {
            try {
                const res = await fetch('https://catfact.ninja/fact');
                const data = await res.json();
                await Bloom.sendMessage(message.key.remoteJid, { text: data.fact }, { quoted: message });
            } catch (error) {
                console.error('Error fetching cat fact:', error);
                await Bloom.sendMessage(
                    message.key.remoteJid,
                    { text: 'Failed to fetch a cat fact. Try again later!' },
                    { quoted: message }
                );
            }
        }
    }
};