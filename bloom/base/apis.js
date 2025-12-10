const axios = require('axios');
const { get } =require('../../colors/setup');
const { footer } = require('../../colors/mess');

// Helper function to convert wind degrees to direction
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}
module.exports = {
    weather: {
        type: 'utility',
        desc: 'Get current weather for a city',
        usage: 'weather <city>',
        run: async (Bloom, message, fulltext) => {
            const sender = message.key.remoteJid;
            // Extract the city name from the command
            const city = fulltext.split(' ').slice(1).join(' ').trim();

            if (!city) {
                return await Bloom.sendMessage(sender, {
                    text: '❓ Please provide a city name. Example: `weather Nairobi`'
                }, { quoted: message });
            }

            try {
                const weatherKey = await get('WEATHERKEY');
                const apiUrl = `http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${weatherKey}`;

                const { data } = await axios.get(apiUrl);

                // If city is not found, OpenWeatherMap returns 404 cod
                if (data.cod !== 200) {
                    return await Bloom.sendMessage(sender, {
                        text: `❌ Couldn't find weather data for *${city}*. Please check the city name.`
                    }, { quoted: message });
                }

                // Format the weather data into a readable message
                const weatherInfo = `
🌤️ *Weather for ${data.name}, ${data.sys.country}*
--------------------------------
• Description: ${data.weather[0].description}
• Temperature: ${data.main.temp}°C (feels like ${data.main.feels_like}°C)
• Humidity: ${data.main.humidity}%
• Wind: ${data.wind.speed} m/s, ${getWindDirection(data.wind.deg)}
• Pressure: ${data.main.pressure} hPa
• Visibility: ${(data.visibility / 1000).toFixed(1)} km
--------------------------------
${footer}`.trim();

                await Bloom.sendMessage(sender, {
                    text: weatherInfo
                }, { quoted: message });

            } catch (err) {
                console.error('Weather API error:', err.message);

                // Handle specific errors
                if (err.response?.status === 404) {
                    await Bloom.sendMessage(sender, {
                        text: `❌ City *${city}* not found. Please check the spelling.`
                    }, { quoted: message });
                } else if (err.response?.status === 401) {
                    await Bloom.sendMessage(sender, {
                        text: '🔑 Invalid API key. Please contact the bot owner.'
                    }, { quoted: message });
                } else {
                    await Bloom.sendMessage(sender, {
                        text: `❌ Failed to fetch weather data for *${city}*. Please try again later.`
                    }, { quoted: message });
                }
            }
        }
    },
    crypto: {
        type: 'utility',
        desc: 'Get all price types (buy, sell, spot) for cryptocurrencies',
        usage: 'crypto <coin1> <coin2> ...\n• Example: crypto btc\n• Example: crypto btc eth sol ada',
        run: async (Bloom, message, fulltext) => {
            const sender = message.key.remoteJid;
            const args = fulltext.split(' ').slice(1);

            if (args.length < 1) {
                return await Bloom.sendMessage(sender, {
                    text: '❓ Please provide at least one cryptocurrency symbol.\n💡 Example: `crypto btc` or `crypto btc eth sol`'
                }, { quoted: message });
            }

            const coins = args.map(coin => coin.toUpperCase());
            const commonCoins = {
                'BTC': 'Bitcoin',
                'ETH': 'Ethereum',
                'LTC': 'Litecoin',
                'BCH': 'Bitcoin Cash',
                'ADA': 'Cardano',
                'DOGE': 'Dogecoin',
                'SOL': 'Solana',
                'XRP': 'Ripple',
                'DOT': 'Polkadot',
                'AVAX': 'Avalanche',
                'MATIC': 'Polygon',
                'LINK': 'Chainlink',
                'UNI': 'Uniswap',
                'BNB': 'Binance Coin',
                'ATOM': 'Cosmos',
                'XLM': 'Stellar'
            };

            try {
                let allResults = [];

                for (const coin of coins) {
                    const coinName = commonCoins[coin] || coin;
                    let coinResults = [];
                    let hasError = false;

                    // Fetch all three price types for this coin
                    for (const priceType of ['buy', 'sell', 'spot']) {
                        try {
                            const apiUrl = `https://api.coinbase.com/v2/prices/${coin}-USD/${priceType}`;
                            const { data } = await axios.get(apiUrl, { timeout: 8000 });

                            const amount = parseFloat(data.data.amount).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            });

                            const priceTypeFormatted = priceType.charAt(0).toUpperCase() + priceType.slice(1);
                            coinResults.push(`  ${priceTypeFormatted}: $${amount} USD`);
                        } catch (error) {
                            hasError = true;
                            coinResults.push(`  ${priceType.charAt(0).toUpperCase()}: ❌ Failed`);
                        }
                    }

                    if (hasError) {
                        allResults.push(`• *${coinName} (${coin})*: ❌ Partial data unavailable`);
                    } else {
                        allResults.push(`• *${coinName} (${coin})*:\n${coinResults.join('\n')}`);
                    }

                    // Small delay between coins to avoid rate limiting
                    if (coins.indexOf(coin) < coins.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                }

                const coinCount = coins.length;
                const responseText = `
 💰 *Cryptocurrency Prices - All Types*
 ${coinCount > 1 ? `📊 Showing ${coinCount} coins` : ''}
 ────────────────
 ${allResults.join('\n\n')}
 ────────────────
 ⏰ *Real-time Data:* Coinbase API
 🔄 Update: *crypto <coin1> <coin2> ...*
 💡 Supported: BTC, ETH, SOL, ADA, DOGE, XRP, DOT, etc.`.trim();

                await Bloom.sendMessage(sender, {
                    text: responseText
                }, { quoted: message });

            } catch (err) {
                console.error('Crypto API error:', err.message);

                if (err.code === 'ECONNREFUSED' || err.message.includes('EAI_AGAIN')) {
                    await Bloom.sendMessage(sender, {
                        text: '🌐 Coinbase API is currently unavailable. Please try again later.'
                    }, { quoted: message });
                } else {
                    await Bloom.sendMessage(sender, {
                        text: '❌ Failed to fetch cryptocurrency prices. Please try again later.'
                    }, { quoted: message });
                }
            }
        }
    },
    meme: {
        type: 'fun',
        desc: 'Fetches a hot meme from Reddit (default or specified subreddit)',
        usage: 'meme or meme [subreddit]',
        run: async (Bloom, message, fulltext) => {
            const sender = message.key.remoteJid;
            const args = fulltext.split(' ').slice(1);
            const subreddit = args.length > 0 ? args[0] : 'memes';

            try {
                const apiUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=50`;
                const { data } = await axios.get(apiUrl, {
                    headers: {
                        'User-Agent': 'Bloom-Bot/1.0'
                    }
                });

                const posts = data.data.children
                .filter(post => !post.data.stickied)
                .filter(post => {
                    const url = post.data.url;
                    return url.match(/\.(jpeg|jpg|png|gif)$/) !== null;
                });

                if (posts.length === 0) {
                    return await Bloom.sendMessage(sender, {
                        text: `❌ No memes found in r/${subreddit}. Try another subreddit.`
                    }, { quoted: message });
                }
                const randomPost = posts[Math.floor(Math.random() * posts.length)].data;
                const caption = `😂 *${randomPost.title}* (r/${subreddit})\n\n⬆️ ${randomPost.ups} upvotes`;
                await Bloom.sendMessage(sender, {
                    image: { url: randomPost.url },
                    caption: caption
                }, { quoted: message });

            } catch (err) {
                console.error('Meme fetch error:', err.message);

                if (err.response && err.response.status === 404) {
                    await Bloom.sendMessage(sender, {
                        text: `❌ Subreddit r/${subreddit} not found. Try a different one.`
                    }, { quoted: message });
                } else {
                    await Bloom.sendMessage(sender, {
                        text: `❌ Failed to fetch meme from r/${subreddit}. Please try again later.`
                    }, { quoted: message });
                }
            }
        }
    }
};
