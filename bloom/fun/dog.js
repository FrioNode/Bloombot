const fetch = require('node-fetch');
module.exports = {
    dog: {
        type: 'fun',
        desc: 'Sends a random dog fact',
        run: async (Bloom, message) => {
            try {
                const res = await fetch('https://dogapi.dog/api/v2/facts');
                const data = await res.json();

                if (data && data.data && data.data.length > 0) {
                    await Bloom.sendMessage(
                        message.key.remoteJid,
                        { text: data.data[0].attributes.body },
                        { quoted: message }
                    );
                } else {
                    throw new Error('No dog facts found.');
                }
            } catch (error) {
                console.error('Error fetching dog fact:', error);
                await Bloom.sendMessage(
                    message.key.remoteJid,
                    { text: 'Failed to fetch a dog fact. Try again later!' },
                    { quoted: message }
                );
            }
        }
    }
};