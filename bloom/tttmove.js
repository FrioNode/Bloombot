// tttmove.js (FINAL SCHEMA-ALIGNED VERSION)
const { TicTacToe } = require('../colors/schema');
const { makeMove, renderBoard, endGame } = require('./ttthandle');

module.exports = {
    tttmove: async (Bloom, message, fulltext) => {
        try {
            const sender = message.key.participant || message.key.remoteJid;
            const group = message.key.remoteJid;
            const move = parseInt(fulltext.trim());

            // Validate move input
            if (isNaN(move) || move < 1 || move > 9) {
                return await Bloom.sendMessage(group, {
                    text: '⚠️ Please enter a number between 1-9'
                });
            }

            // Find active game - updated to match schema fields
            const game = await TicTacToe.findOne({
                groupId: group,
                status: 'active'
            }).select('player1 player2 currentTurn board status').lean();

            if (!game) {
                return await Bloom.sendMessage(group, {
                    text: '❌ No active game found. Start a new game with !ttt'
                });
            }

            // Verify player
            const players = [game.player1.jid, game.player2.jid];
            if (!players.includes(sender)) {
                return await Bloom.sendMessage(group, {
                    text: '🚫 You are not a player in this game'
                });
            }

            // Process move
            const result = await makeMove(sender, move);

            if (result.error) {
                return await Bloom.sendMessage(group, {
                    text: result.error
                });
            }

            // Handle game result
            const boardText = renderBoard(result.board);

            if (result.status === 'win') {
                await Bloom.sendMessage(group, {
                    text: `🎉 @${result.winnerPrefix} (${result.winnerName}) wins!\n\n${boardText}`,
                                        mentions: [result.winnerJid]
                });
                await endGame(group);
            }
            else if (result.status === 'draw') {
                await Bloom.sendMessage(group, {
                    text: `🤝 Game ended in draw!\n\n${boardText}`
                });
                await endGame(group);
            }
            // In your tttmove.js handler:
            else {
                // Replace the turn notification part with:
                await Bloom.sendMessage(group, {
                    text: `${boardText}\n\n🎯 @${result.nextPlayer.jid.split('@')[0]}'s turn (${result.nextPlayer.symbol})`,
                                        mentions: [result.nextPlayer.jid]
                });
            }

        } catch (err) {
            console.error('TTT Move Error:', err);
            const group = message?.key?.remoteJid;
            if (group) {
                await Bloom.sendMessage(group, {
                    text: '⚠️ An error occurred during the move'
                });
            }
        }
    }
};