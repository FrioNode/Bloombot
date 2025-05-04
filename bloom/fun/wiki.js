const axios = require('axios');

module.exports = {
    wiki: {
        type: 'fun',
        desc: 'Search Wikipedia and get a summary of a topic',
        usage: 'wiki <topic>',
        run: async (Bloom, message, fulltext) => {
            const sender = message.key.remoteJid;
            const query = fulltext.split(' ').slice(1).join(' ').trim();

            if (!query) {
                return await Bloom.sendMessage(sender, {
                    text: '❓ Please provide a topic to search. Example: `wiki moon landing`'
                }, { quoted: message });
            }

            try {
                const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
                const { data } = await axios.get(apiUrl);

                if (data.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') {
                    return await Bloom.sendMessage(sender, {
                        text: `❌ Couldn't find anything on *${query}*.`
                    }, { quoted: message });
                }

                const snippet = data.extract.length > 500
                ? data.extract.slice(0, 500) + '...'
                : data.extract;

                const link = data.content_urls.desktop.page;

                await Bloom.sendMessage(sender, {
                    text: `🧠 *${data.title}*\n\n${snippet}\n\n🔗 ${link}`
                }, { quoted: message });

            } catch (err) {
                console.error('Wiki search error:', err.message);
                await Bloom.sendMessage(sender, {
                    text: `❌ Failed to fetch info on *${query}*.`
                }, { quoted: message });
            }
        }
    }
};