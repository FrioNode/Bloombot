const axios = require('axios');
const { pixelkey } =require('../../colors/setup');
const { footer } = require('../../colors/mess');
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
                    text: `🧠 *${data.title}*\n\n${snippet}\n\n🔗 ${link}\n${footer}`
                }, { quoted: message });

            } catch (err) {
                console.error('Wiki search error:', err.message);
                await Bloom.sendMessage(sender, {
                    text: `❌ Failed to fetch info on *${query}*.`
                }, { quoted: message });
            }
        }
    },
    number: {
        type: 'fun',
        desc: 'Sends a random number trivia fact',
        run: async (Bloom, message) => {
            try {
                const res = await fetch('http://numbersapi.com/random/trivia?json');
                const data = await res.json();
                await Bloom.sendMessage(
                    message.key.remoteJid,
                    { text: data.text + `\n${footer}` },
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
    },
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
                    { text: joke +`\n${footer}` },
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
    },
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
                    headers: { Authorization: pixelkey }
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
                    footer: `🖼️ Random image of: *${query}*`
                }, { quoted: message });

            } catch (err) {
                console.error('Pexels image error:', err.message);
                await Bloom.sendMessage(sender, {
                    text: `❌ Failed to fetch image for *${query}*.`
                }, { quoted: message });
            }
        }
    },
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
    },
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
    },
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
    },
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