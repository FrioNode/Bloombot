const { get } =require('../../colors/setup');
const { GroqAI } = require('../../colors/groq');
const models = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile','qwen/qwen3-32b']; 


module.exports = {
    x: {
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
