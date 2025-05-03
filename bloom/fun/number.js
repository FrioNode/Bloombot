const fetch = require('node-fetch');
module.exports = {
    number: {
        type: 'fun',
        desc: 'Sends a random number trivia fact',
        run: async (Bloom, message) => {
            try {
                const res = await fetch('http://numbersapi.com/random/trivia?json');
                const data = await res.json();
                await Bloom.sendMessage(
                    message.key.remoteJid,
                    { text: data.text },
                    { quoted: message }
                );
            } catch (error) {
                console.error('Error fetching number trivia:', error);
                await Bloom.sendMessage(
                    message.key.remoteJid,
                    { text: 'Failed to fetch number trivia. Try again later!' },
                    { quoted: message }
                );
            }
        }
    }
};