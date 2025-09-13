const stringSimilarity = require('string-similarity');
const axios = require('axios');

module.exports = {
riddle: {
    type: 'game',
    desc: 'Starts a riddle game with limitless questions from an API',
    usage: 'riddle',
    run: async (Bloom, message, fulltext) => {
        const sender = message.key.remoteJid;

        try {
            // Try to fetch from Riddle API
            const apiUrl = 'https://riddles-api.vercel.app/random';
            const { data } = await axios.get(apiUrl);

            // Initialize or get game state for user
            if (!riddleGames) riddleGames = new Map();

            // Create new game
            const newGame = {
                riddle: data.riddle,
                answer: data.answer,
                hintsUsed: 0,
                attempts: 0,
                maxHints: 3, // Maximum hints to provide
                completed: false,
                startTime: Date.now(),
                hints: [
                    `Hint 1: ${generateHint(data.answer, 1)}`,
                    `Hint 2: ${generateHint(data.answer, 2)}`,
                    `Hint 3: ${generateHint(data.answer, 3)}`
                ]
            };

            riddleGames.set(sender, newGame);

            await Bloom.sendMessage(sender, {
                text: `🤔 *Riddle Time!*\n\n${data.riddle}\n\nYou have unlimited attempts and ${newGame.maxHints} hints available.\n\nType *guess <your answer>* to make a guess.\nType *hint* to get a hint.\nType *answer* to give up and see the solution.`
            }, { quoted: message });

        } catch (err) {
            console.error('Riddle API error:', err.message);

            // Fallback to local riddles if API fails
            const localRiddles = [
                {
                    riddle: "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?",
                    answer: "an echo"
                },
                {
                    riddle: "The more of me you take, the more you leave behind. What am I?",
                    answer: "footsteps"
                },
                {
                    riddle: "What has keys but can't open locks?",
                    answer: "a piano"
                },
                {
                    riddle: "What has a heart that doesn't beat?",
                    answer: "an artichoke"
                },
                {
                    riddle: "What can travel around the world while staying in a corner?",
                    answer: "a stamp"
                }
            ];

            const randomRiddle = localRiddles[Math.floor(Math.random() * localRiddles.length)];

            if (!riddleGames) riddleGames = new Map();

            const newGame = {
                riddle: randomRiddle.riddle,
                answer: randomRiddle.answer,
                hintsUsed: 0,
                attempts: 0,
                maxHints: 3,
                completed: false,
                startTime: Date.now(),
                hints: [
                    `Hint 1: ${generateHint(randomRiddle.answer, 1)}`,
                    `Hint 2: ${generateHint(randomRiddle.answer, 2)}`,
                    `Hint 3: ${generateHint(randomRiddle.answer, 3)}`
                ]
            };

            riddleGames.set(sender, newGame);

            await Bloom.sendMessage(sender, {
                text: `🤔 *Riddle Time!*\n\n${randomRiddle.riddle}\n\nYou have unlimited attempts and ${newGame.maxHints} hints available.\n\nType *guess <your answer>* to make a guess.\nType *hint* to get a hint.\nType *answer* to give up and see the solution.`
            }, { quoted: message });
        }
    }
},

// Command to make a guess
guess: {
    type: 'game',
    desc: 'Make a guess for the current riddle',
    usage: 'guess <answer>',
    run: async (Bloom, message, fulltext) => {
        const sender = message.key.remoteJid;
        const userGuess = fulltext.split(' ').slice(1).join(' ').trim().toLowerCase();

        if (!riddleGames || !riddleGames.has(sender)) {
            return await Bloom.sendMessage(sender, {
                text: 'You need to start a riddle game first! Type *riddle* to begin.'
            }, { quoted: message });
        }

        const game = riddleGames.get(sender);

        if (!userGuess) {
            return await Bloom.sendMessage(sender, {
                text: 'Please provide a guess! Example: *guess echo*'
            }, { quoted: message });
        }

        if (game.completed) {
            return await Bloom.sendMessage(sender, {
                text: `You've already solved this riddle! The answer was *${game.answer}*.\n\nType *riddle* for a new challenge!`
            }, { quoted: message });
        }

        // Check if guess is correct (flexible matching)
        game.attempts++;

        if (isAnswerCorrect(userGuess, game.answer)) {
            game.completed = true;
            const timeTaken = Math.floor((Date.now() - game.startTime) / 1000);

            await Bloom.sendMessage(sender, {
                text: `🎉 *Correct!* You solved the riddle in ${game.attempts} attempt${game.attempts === 1 ? '' : 's'} and ${timeTaken} seconds!\n\nYou used ${game.hintsUsed} hint${game.hintsUsed === 1 ? '' : 's'}.\n\nType *riddle* for a new challenge!`
            }, { quoted: message });

            riddleGames.delete(sender);
            return;
        }

        // Provide feedback for wrong guess
        await Bloom.sendMessage(sender, {
            text: `❌ Not quite right! Try again or type *hint* for help.\n\nYou've made ${game.attempts} attempt${game.attempts === 1 ? '' : 's'} so far.`
        }, { quoted: message });

        // Update game state
        riddleGames.set(sender, game);
    }
},

// Command to get a hint
hint: {
    type: 'game',
    desc: 'Get a hint for the current riddle',
    usage: 'hint',
    run: async (Bloom, message, fulltext) => {
        const sender = message.key.remoteJid;

        if (!riddleGames || !riddleGames.has(sender)) {
            return await Bloom.sendMessage(sender, {
                text: 'You need to start a riddle game first! Type *riddle* to begin.'
            }, { quoted: message });
        }

        const game = riddleGames.get(sender);

        if (game.completed) {
            return await Bloom.sendMessage(sender, {
                text: `You've already solved this riddle! The answer was *${game.answer}*.\n\nType *riddle* for a new challenge!`
            }, { quoted: message });
        }

        // Check if hints are available
        if (game.hintsUsed >= game.maxHints) {
            return await Bloom.sendMessage(sender, {
                text: `You've used all available hints! The answer is *${game.answer}*.\n\nType *riddle* for a new challenge.`
            }, { quoted: message });
        }

        // Provide the next hint
        game.hintsUsed++;
        const currentHint = game.hints[game.hintsUsed - 1];

        await Bloom.sendMessage(sender, {
            text: `💡 ${currentHint}\n\nYou've used ${game.hintsUsed} of ${game.maxHints} hints.\n\nType *guess <answer>* to make a guess.`
        }, { quoted: message });

        // Update game state
        riddleGames.set(sender, game);
    }
},

// Command to reveal the answer
answer: {
    type: 'game',
    desc: 'Reveal the answer to the current riddle',
    usage: 'answer',
    run: async (Bloom, message, fulltext) => {
        const sender = message.key.remoteJid;

        if (!riddleGames || !riddleGames.has(sender)) {
            return await Bloom.sendMessage(sender, {
                text: 'You need to start a riddle game first! Type *riddle* to begin.'
            }, { quoted: message });
        }

        const game = riddleGames.get(sender);

        if (game.completed) {
            return await Bloom.sendMessage(sender, {
                text: `You've already solved this riddle! The answer was *${game.answer}*.\n\nType *riddle* for a new challenge!`
            }, { quoted: message });
        }

        game.completed = true;

        await Bloom.sendMessage(sender, {
            text: `The answer is: *${game.answer}*\n\nBetter luck next time! Type *riddle* for a new challenge.`
        }, { quoted: message });

        riddleGames.delete(sender);
    }
}
};
// Global variable to store riddle game states
let riddleGames = null;

// Generate hints based on answer complexity
function generateHint(answer, level) {
    const words = answer.split(' ');

    if (level === 1) {
        // First hint: number of words and first letters
        return `The answer has ${words.length} word${words.length > 1 ? 's' : ''} and starts with "${words[0].charAt(0).toUpperCase()}"`;
    }
    else if (level === 2) {
        // Second hint: first word and last letter
        const firstWord = words[0];
        const lastLetter = words[words.length - 1].charAt(words[words.length - 1].length - 1);
        return `The first word is "${firstWord}" and it ends with "${lastLetter.toUpperCase()}"`;
    }
    else {
        // Third hint: almost the full answer with some letters missing
        let hint = '';
        for (const word of words) {
            for (let i = 0; i < word.length; i++) {
                if (i % 2 === 0 || word.length < 4) {
                    hint += word[i];
                } else {
                    hint += '_';
                }
            }
            hint += ' ';
        }
        return `The answer looks something like: ${hint.trim()}`;
    }
}

// Flexible answer checking
function isAnswerCorrect(guess, answer) {
    // Remove articles and common prefixes for better matching
    const cleanGuess = guess.replace(/^(a|an|the)\s+/i, '').trim();
    const cleanAnswer = answer.replace(/^(a|an|the)\s+/i, '').trim();

    // Check direct match
    if (cleanGuess === cleanAnswer) return true;

    // Check if guess is contained in answer or vice versa
    if (cleanAnswer.includes(cleanGuess) && cleanGuess.length > 3) return true;
    if (cleanGuess.includes(cleanAnswer) && cleanAnswer.length > 3) return true;

    // Check for close matches (allowing for minor typos)
    const similarity = stringSimilarity.compareTwoStrings(cleanGuess, cleanAnswer);
    if (similarity > 0.7) return true;

    return false;
}