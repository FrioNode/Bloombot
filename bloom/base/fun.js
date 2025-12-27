const axios = require('axios');
const figlet = require('figlet');
const { get } =require('../../colors/setup');
const { mess, initMess } = require('../../colors/mess');
initMess(); let footer = mess.footer;
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
                text: '❓ Provide a topic. Example: `wiki moon landing`'
            }, { quoted: message });
        }

        try {
            const HEADERS = {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Node; Linux) LunaBot/1.0',
                    'Accept': 'application/json'
                }
            };

            const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`;
            const searchRes = await axios.get(searchUrl, HEADERS);

            if (!searchRes.data.query.search.length) {
                return await Bloom.sendMessage(sender, {
                    text: `❌ No results found for *${query}*.`
                }, { quoted: message });
            }

            const bestTitle = searchRes.data.query.search[0].title;
            const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`;
            const { data } = await axios.get(summaryUrl, HEADERS);

            const snippet = data.extract.length > 500
                ? data.extract.slice(0, 500) + '...'
                : data.extract;

            await Bloom.sendMessage(sender, {
                text: `🧠 *${data.title}*\n\n${snippet}\n\n🔗 ${data.content_urls.desktop.page}`
            }, { quoted: message });

        } catch (err) {
            console.error('Wiki error:', err.message);
            await Bloom.sendMessage(sender, {
                text: `❌ Failed to fetch info on *${query}* (API blocked).`
            }, { quoted: message });
        }
    }
},
    urban: {
    type: 'fun',
    desc: 'Search Urban Dictionary and get a definition',
    usage: 'urban <term>',
    run: async (Bloom, message, fulltext) => {
        const sender = message.key.remoteJid;
        const query = fulltext.split(' ').slice(1).join(' ').trim();

        if (!query) {
            return await Bloom.sendMessage(sender, {
                text: '❓ Please provide a term to search. Example: `urban lit`'
            }, { quoted: message });
        }

        try {
            const apiUrl = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(query)}`;
            const { data } = await axios.get(apiUrl);

            if (!data.list || data.list.length === 0) {
                return await Bloom.sendMessage(sender, {
                    text: `❌ Couldn't find any definition for *${query}*.`
                }, { quoted: message });
            }

            // Take first definition
            const first = data.list[0];
            const snippet = first.definition.length > 500
                ? first.definition.slice(0, 500) + '...'
                : first.definition;

            const example = first.example ? `\n\n💬 Example:\n${first.example}` : '';
            const link = first.permalink;

            await Bloom.sendMessage(sender, {
                text: `📖 *${first.word}*\n\n${snippet}${example}\n\n🔗 ${link}`
            }, { quoted: message });

        } catch (err) {
            console.error('Urban search error:', err.message);
            await Bloom.sendMessage(sender, {
                text: `❌ Failed to fetch definition for *${query}*.` 
            }, { quoted: message });
        }
    }
},

    quote: {
        type: 'fun',
        desc: 'Get a random inspirational quote',
        usage: 'quote',
        run: async (Bloom, message, fulltext) => {
            const sender = message.key.remoteJid;
            const ninjaKey = await get('NINJAKEY');
            if (!ninjaKey || ninjaKey === '') {
                console.error('API Key is missing or invalid.');
                return await Bloom.sendMessage(sender, {
                    text: '❌ Quote service is misconfigured. Please report this to the bot owner.'
                }, { quoted: message });
            }

            try {
                const apiUrl = 'https://api.api-ninjas.com/v1/quotes';
                const config = {
                    headers: {
                        'X-Api-Key': ninjaKey.trim()
                    },
                    timeout: 10000 // 10 second timeout
                };

                const response = await axios.get(apiUrl, config);
                const quoteData = response.data[0]; // Data is an array with one object

                const formattedQuote = `
💬 *Random Quote*
 ────────────────
"${quoteData.quote}"
- *${quoteData.author}*
 ────────────────
*Category:* ${quoteData.category}`.trim();

                await Bloom.sendMessage(sender, {
                    text: formattedQuote
                }, { quoted: message });

            } catch (err) {
                console.error('Quote API error:', err.message);
                if (err.response) {
                    // Server responded with an error status (4xx, 5xx)
                    switch (err.response.status) {
                        case 400:
                            await Bloom.sendMessage(sender, {
                                text: '🔑 Invalid API Key configured. Please contact the bot owner.'
                            }, { quoted: message });
                            break;
                        case 403:
                            await Bloom.sendMessage(sender, {
                                text: '🔑 Access denied. The API key may be invalid or expired.'
                            }, { quoted: message });
                            break;
                        case 429:
                            await Bloom.sendMessage(sender, {
                                text: '📊 Daily quote limit reached. Please try again tomorrow.'
                            }, { quoted: message });
                            break;
                        default:
                            await Bloom.sendMessage(sender, {
                                text: '❌ The quote service is currently unavailable. Please try again later.'
                            }, { quoted: message });
                    }
                } else if (err.request) {
                    // Request was made but no response received (network error)
                    await Bloom.sendMessage(sender, {
                        text: '🌐 Network error. Could not connect to the quote service.'
                    }, { quoted: message });
                } else {
                    // Something else happened
                    await Bloom.sendMessage(sender, {
                        text: '❌ An unexpected error occurred while fetching a quote.'
                    }, { quoted: message });
                }
            }
        }
    },
        number: {
        type: 'fun',
        desc: 'Sends a random number fact',
        run: async (Bloom, message) => {
            try {
                const res = await fetch('https://numbersapi.com/random/trivia?json');
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
                    { text: 'Failed to fetch number trivia. API is unstable until its maintained' },
                    { quoted: message }
                );
            }
        }
    },
trivia: {
    type: 'fun',
    desc: 'Sends a random trivia fact',
    run: async (Bloom, message) => {
        try {
            const res = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const data = await res.json();
            if (!data.text) {
                throw new Error('Invalid API response');
            }
            await Bloom.sendMessage(
                message.key.remoteJid,
                { text: `${data.text}\n${footer}` },
                { quoted: message }
            );
        } catch (error) {
            console.error('Error fetching trivia fact:', error);

            await Bloom.sendMessage(
                message.key.remoteJid,
                { text: 'Failed to fetch a trivia fact. Try again later!' },
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
                const pixelkey = await get('PIXELKEY');
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
                console.log(footer);
                await Bloom.sendMessage(sender, {
                    image: { url: imageUrl },
                    caption: `🖼️ Random image of: *${query}*\n_Results are randomly selected._`
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
    },
        ascii: {
            type: 'fun',
            desc: 'Convert text to ASCII art with optional font',
            usage: 'ascii [font] <text>\n• Available fonts: Standard, Block, Big, Small, Ghost, Graffiti, Digital, Bubble, Slant, Shadow, Script, Mini, Banner, Doom, 4Max',
            run: async (Bloom, message, fulltext) => {
                const sender = message.key.remoteJid;
                const args = fulltext.split(' ').slice(1);

                if (args.length < 1) {
                    return await Bloom.sendMessage(sender, {
                        text: '❓ Please provide text to convert. Example: `ascii Hello` or `ascii Block Sample Text`'
                    }, { quoted: message });
                }

                // List of available fonts for validation
                const availableFonts = [
                    'Standard', 'Block', 'Big', 'Small', 'Ghost', 'Graffiti',
                    'Digital', 'Bubble', 'Slant', 'Shadow', 'Script', 'Mini',
                    'Banner', 'Doom', '3D', '3D Diagonal', '4Max', '5 Line Oblique'
                ];

                let font = 'Standard'; // Default font
                let text;

                // Check if first argument is a valid font
                if (args.length >= 2 && availableFonts.includes(args[0])) {
                    font = args[0];
                    text = args.slice(1).join(' ');
                } else {
                    text = args.join(' ');
                }

                // Limit input length
                if (text.length > 15) {
                    return await Bloom.sendMessage(sender, {
                        text: '❌ Text too long! Please use 15 characters or less for better formatting.'
                    }, { quoted: message });
                }

                try {
                    // Generate ASCII art with the selected font
                    figlet.text(text, {
                        font: font,
                        horizontalLayout: 'default',
                        verticalLayout: 'default'
                    }, (err, asciiArt) => {
                        if (err) {
                            console.error('Figlet error:', err);
                            Bloom.sendMessage(sender, {
                                text: '❌ Failed to generate ASCII art. The font might not support all characters.'
                            }, { quoted: message });
                            return;
                        }

                        const responseText = `
 ✨ *ASCII Art [${font} Font]*
 🔤 Text: "${text}"
 ────────────────
\`\`\`
${asciiArt}
\`\`\`
 ────────────────
 💡 Tip: Use \`ascii <font> <text>\` to try different styles!`.trim();

                        Bloom.sendMessage(sender, {
                            text: responseText
                        }, { quoted: message });
                    });

                } catch (err) {
                    console.error('ASCII generation error:', err.message);
                    await Bloom.sendMessage(sender, {
                        text: '❌ Failed to generate ASCII art. Please try again.'
                    }, { quoted: message });
                }
            }
        }
};
