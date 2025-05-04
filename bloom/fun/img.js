const axios = require('axios');
const { pixelKey } = require('../../colors/setup');

module.exports = {
    img: {
        type: 'fun',
        desc: 'Fetches a random image from Pexels based on a query',
        usage: 'img <search term>',
        run: async (Bloom, message, fulltext) => {
            const sender = message.key.remoteJid;
            const query = fulltext.split(' ').slice(1).join(' ').trim() || 'random';
            const apiUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10`;

            try {
                const { data } = await axios.get(apiUrl, {
                    headers: { Authorization: pixelKey }
                });

                if (!data.photos || data.photos.length === 0) {
                    return await Bloom.sendMessage(sender, {
                        text: `😢 No images found for *${query}*.`
                    }, { quoted: message });
                }

                const random = data.photos[Math.floor(Math.random() * data.photos.length)];
                const imageUrl = random.src.medium;

                await Bloom.sendMessage(sender, {
                    image: { url: imageUrl },
                    caption: `🖼️ Random image of: *${query}*`
                }, { quoted: message });

            } catch (err) {
                console.error('Pexels image error:', err.message);
                await Bloom.sendMessage(sender, {
                    text: `❌ Failed to fetch image for *${query}*.`
                }, { quoted: message });
            }
        }
    }
};
