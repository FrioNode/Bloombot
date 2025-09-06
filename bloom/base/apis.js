const axios = require('axios');
const { weatherKey } =require('../../colors/setup');
const { footer } = require('../../colors/mess');

// Helper function to convert wind degrees to direction
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}
module.exports = {
    weather: {
        type: 'apis',
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
    }
};
