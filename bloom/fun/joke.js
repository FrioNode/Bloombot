const fetch = require('node-fetch');
module.exports = {
    joke: {
        type: 'fun',
        desc: 'Sends a random joke',
        run: async (Bloom, message) => {
            try {
                const res = await fetch('https://official-joke-api.appspot.com/random_joke');
                const data = await res.json();
                const joke = `${data.setup} - ${data.punchline}`;
                await Bloom.sendMessage(
                    message.key.remoteJid,
                    { text: joke },
                    { quoted: message }
                );
            } catch (error) {
                console.error('Error fetching joke:', error);
                await Bloom.sendMessage(
                    message.key.remoteJid,
                    { text: 'Failed to fetch a joke. Try again later!' },
                    { quoted: message }
                );
            }
        }
    }
};