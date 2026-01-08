const axios = require('axios');
module.exports = {
    x: {
    type: 'utility',
    desc: 'Ask Luna (Ollama) a question',
    usage: 'x <question>',
    run: async (Bloom, message, fulltext) => {
        const sender = message.key.remoteJid;

        // Extract prompt
        const prompt = fulltext.split(' ').slice(1).join(' ').trim();

        if (!prompt) {
            return await Bloom.sendMessage(sender, {
                text: '❓ Please provide a question. Example: `x who are you?`'
            }, { quoted: message });
        }

        try {
            const { data } = await axios.post(
                'http://localhost:11434/api/generate',
                {
                    model: 'luna',
                    prompt: prompt,
                    stream: false
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 60000
                }
            );

            if (!data || !data.response) {
                return await Bloom.sendMessage(sender, {
                    text: '❌ No response from Luna.'
                }, { quoted: message });
            }

            const reply = `
🌙 *Luna AI says*

${data.response.trim()}
> @frionode Labs (c) 2026`.trim();

            await Bloom.sendMessage(sender, {
                text: reply
            }, { quoted: message });

        } catch (err) {
            console.error('Ollama API error:', err.message);

            if (err.code === 'ECONNREFUSED') {
                await Bloom.sendMessage(sender, {
                    text: '❌ Ollama is not running on localhost:11434.'
                }, { quoted: message });
            } else if (err.response) {
                await Bloom.sendMessage(sender, {
                    text: `❌ Ollama error (${err.response.status}).`
                }, { quoted: message });
            } else {
                await Bloom.sendMessage(sender, {
                    text: '❌ Failed to contact Luna. Please try again later.'
                }, { quoted: message });
            }
        }
    }
}
}