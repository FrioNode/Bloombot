const fetch = require('node-fetch');
module.exports = {
    chuck: {
        type: 'fun',
        desc: 'Sends a random Chuck Norris joke',
        run: async (Bloom, message) => {
            try {
                const res = await fetch('https://api.chucknorris.io/jokes/random');
                const data = await res.json();
                await Bloom.sendMessage(message.key.remoteJid, { text: data.value }, { quoted: message });
            } catch (error) {
                console.error('Error fetching Chuck Norris joke:', error);
                await Bloom.sendMessage(
                    message.key.remoteJid,
                    { text: 'Failed to fetch a Chuck Norris joke. Try again later!' },
                    { quoted: message }
                );
            }
        }
    }
};
