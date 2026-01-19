const fetch = require('node-fetch');

class GroqAI {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async processQuery(prompt, options = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: options.model_choice || 'llama-3.1-8b-instant', 
                    messages: [
                        {
                            role: 'system',
                            content: options.system_prompt || 'You are Luna. Create engaging WhatsApp responses.'
                        },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 1000,
                    temperature: 0.7,
                    stream: false
                }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`${response.status}: ${errorData.error?.message || 'Groq API error'}`);
            }

            const data = await response.json();
            return [{
                content: {
                    parts: [{
                        text: data.choices[0].message.content
                    }]
                }
            }];
        } catch (error) {
            if (error.name === 'AbortError') throw new Error('Request timeout - try again');
            throw error;
        }
    }
}

module.exports = { GroqAI };