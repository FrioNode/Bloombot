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

const { get } = require('./setup'); // For GROQ API key

// 🔥 REAL AI BRAIN - Replaces dummy getAIMove()
async function getAIMove(renderBoard, board) {
    try {
        const GROQ_API_KEY = await get('GROQ');
        if (!GROQ_API_KEY) {
            console.log('[AI] No GROQ key, using fallback');
            return 5; // Fallback if no API key
        }

        const ai = new GroqAI(GROQ_API_KEY);
        const boardStr = renderBoard(board);
        
        // PERFECT Tic Tac Toe prompt for Groq
        const prompt = `Tic Tac Toe board:
${boardStr}

You are ⭕ (O). Human is ❌ (X). 
Current empty positions: ${board.map((cell, i) => cell === ' ' ? i+1 : '').filter(Boolean).join(', ')}

Rules:
1. Reply ONLY with a number 1-9 (empty position)
2. Play perfectly - win if possible, block human win, take center/corners
3. Choose BEST strategic move

Best move (number only):`;

        const systemPrompt = `You are perfect Tic Tac Toe AI (⭕). 
- Analyze board completely
- Win immediately if possible  
- Block human win if possible
- Take center (5) > corners (1,3,7,9) > edges
- Reply ONLY with number 1-9, nothing else`;

        const response = await ai.processQuery(prompt, {
            model_choice: 'llama-3.1-8b-instant',
            system_prompt: systemPrompt
        });

        // Extract number from AI response
        const aiText = response[0]?.content?.parts[0]?.text?.trim() || '';
        const aiMove = parseInt(aiText.match(/\d+/)?.[0]);
        
        // Validate move
        if (aiMove >= 1 && aiMove <= 9) {
            const idx = aiMove - 1;
            if (board[idx] === ' ') {
                console.log(`[REAL AI] Groq chose: ${aiMove}`);
                return aiMove;
            }
        }

        // Fallback to smart moves if AI fails
        console.log(`[REAL AI] Invalid move "${aiText}", using fallback`);
        const smartMoves = [5, 1, 3, 7, 9, 2, 4, 6, 8];
        for (const move of smartMoves) {
            if (board[move - 1] === ' ') return move;
        }
        return 5;

    } catch (error) {
        console.error('[REAL AI ERROR]:', error.message);
        // Fallback to smart moves
        const smartMoves = [5, 1, 3, 7, 9, 2, 4, 6, 8];
        for (const move of smartMoves) {
            if (board[move - 1] === ' ') return move;
        }
        return 5;
    }
}

module.exports = { GroqAI, getAIMove };