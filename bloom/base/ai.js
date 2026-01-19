const { get } =require('../../colors/setup');
const fetch = require('node-fetch');
const models = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile','qwen/qwen3-32b']; 

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
                    temperature: 0.7
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

module.exports = {
    gem: {
        type: 'utility',
        desc: 'Use Luna AI to answer questions or have a conversation',
        usage: 'ai <your question>',
        run: async (Luna, message, fulltext) => {
            const sender = message.key.remoteJid;
            const query = fulltext.split(' ').slice(1).join(' ').trim();
            
            if (!query) {
                return await Luna.sendMessage(sender, {
                    text: '❓ Please provide a question or prompt for the AI. Example: `ai What is the capital of France?`'
                }, { quoted: message });
            } 

            try {
                const GROQ_API_KEY = await get('GROQ');
                const aiProcessor = new GroqAI(GROQ_API_KEY);
                const response = await aiProcessor.processQuery(query, {
                    model_choice: models[1],
                    system_prompt: "You are Luna. Create engaging WhatsApp conversations."
                });
                
                const aiText = response?.[0]?.content?.parts?.[0]?.text;
                if (!aiText) {
                    throw new Error("No response from AI");
                }
                
                const reply = aiText.replace(/^["']|["']$/g, '').trim();
                await Luna.sendMessage(sender, {
                    text: `> 🤖 *Luna Response:*\n\n${reply}`
                }, { quoted: message });
                
            } catch (error) {
                console.error('AI Processing Error:', error.message);
                await Luna.sendMessage(sender, {
                    text: `⚠️ *Luna AI Error:*\n\n${error.message}\n\n💡 Get free key: console.groq.com/keys`
                }, { quoted: message });
            }
        },
    }
};
