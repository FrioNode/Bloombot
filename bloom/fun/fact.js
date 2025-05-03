const fetch = require('node-fetch');

module.exports = {
    fact: {
        type: 'fun',
        desc: 'Sends a random fact from the internet',
        run: async (Bloom, message) => {
            try {
                const res = await fetch('https://uselessfacts.jsph.pl/random.json?language=en');
                const data = await res.json();
                await Bloom.sendMessage(
                    message.key.remoteJid,
                    { text: data.text },
                    { quoted: message }
                );
            } catch (error) {
                console.error('Error fetching fact:', error);
                await Bloom.sendMessage(
                    message.key.remoteJid,
                    { text: 'Failed to fetch a fact. Try again later!' },
                    { quoted: message }
                );
            }
        }
    }
};