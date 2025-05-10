const { createGame, joinGame, endGame, renderBoard, makeMove } = require('../ttthandle');
const { TicTacToe } = require('../../colors/schema');

module.exports = {
    ttt: {
        type: 'game',
        desc: 'Tic Tac Toe game (create, join, end)',
        usage: `🎮 *TIC TAC TOE HELP* 🎮

        *Commands*:
        ➼ \`!ttt\` - Create new game (you're ❌)
        ➼ \`!ttt join\` - Join waiting game (you're ⭕)
        ➼ \`!ttt end\` - End current game
        ➼ \`1-9\` - Make a move (during game)

        *Rules*:
        1. ❌ always goes first
        2. Win by getting 3 in a row
        3. 5-min timeout for waiting games

        *Tips*:
        - Tag players when it's their turn
        - Use \`!ttt end\` to cancel stale games`,
        run: async (Bloom, message, fulltext) => {
            try {
                const sender = message.key.participant || message.key.remoteJid;
                const groupId = message.key.remoteJid;
                const arg = fulltext.trim().split(' ')[1];

                if (!groupId.endsWith('@g.us')) {
                    return await Bloom.sendMessage(groupId, {
                        text: '❌ This command only works in group chats.'
                    });
                }

                if (!arg) {
                    const res = await createGame(sender, groupId);
                    if (res.error) {
                        return await Bloom.sendMessage(groupId, { text: res.error });
                    }

                    return await Bloom.sendMessage(groupId, {
                        text: `🎮 Tic Tac Toe game created!\n\n` +
                        `👤 Player 1: @${sender.split('@')[0]} (❌)\n` +
                        `Type *ttt join* to join as Player 2 (⭕)\n` +
                        `Game ID: ${res.roomId}`,
                        mentions: [sender]
                    });
                }

                if (arg === 'join') {
                    const res = await joinGame(sender, groupId);
                    if (res.error) {
                        return await Bloom.sendMessage(groupId, { text: res.error });
                    }

                    const board = renderBoard(res.board);
                    return await Bloom.sendMessage(groupId, {
                        text: `✅ Game started!\n\n` +
                        `❌: @${res.player1.name || res.player1.jid.split('@')[0]}\n` +
                        `⭕: @${res.player2.name || res.player2.jid.split('@')[0]}\n\n` +
                        `${board}\n\n` +
                        `▶️ @${res.player1.jid.split('@')[0]}'s turn first (❌)`,
                                                   mentions: [res.player1.jid, res.player2.jid]
                    });
                }

                if (arg === 'end') {
                    const res = await endGame(sender);
                    if (res.error) {
                        return await Bloom.sendMessage(groupId, { text: res.error });
                    }
                    return await Bloom.sendMessage(groupId, {
                        text: `✅ Game ended by @${sender.split('@')[0]}`,
                                                   mentions: [sender]
                    });
                }
                return await Bloom.sendMessage(groupId, {
                    text: '❗ Invalid command. Use:\n' +
                    '• `ttt` - Create game\n' +
                    '• `ttt join` - Join game\n' +
                    '• `ttt end` - End game'
                });

            } catch (err) {
                console.error('TTT Command Error:', err);
                const groupId = message?.key?.remoteJid;
                if (groupId) {
                    await Bloom.sendMessage(groupId, {
                        text: '⚠️ An error occurred while processing the game command'
                    });
                }
            }
        }
    }
};