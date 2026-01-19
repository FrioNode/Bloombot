const { TicTacToe, Reminder } = require('../colors/schema');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');
const activeTimeouts = new Map();

function renderBoard(board) {
    const emojiMap = { ' ': '⏺️', '❌': '❌', '⭕': '⭕' };
    let rendered = '';
    for (let i = 0; i < 9; i += 3) {
        rendered += board.slice(i, i + 3).map(cell => emojiMap[cell]).join(' ') + '\n';
    }
    return rendered.trim();
}

function checkWinner(board) {
    const wins = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    for (const [a, b, c] of wins) {
        if (board[a] !== ' ' && board[a] === board[b] && board[b] === board[c]) {
            return board[a];
        }
    }
    return board.includes(' ') ? null : 'draw';
}

// AI HELPER FUNCTION - Simple logic, NO external dependencies
function getAIMove(board) {
    // Smart moves: center first, then corners, then edges
    const smartMoves = [5, 1, 3, 7, 9, 2, 4, 6, 8];
    
    for (const move of smartMoves) {
        const idx = move - 1;
        if (board[idx] === ' ') {
            return move;
        }
    }
    return 5; // Fallback
}

async function createGame(senderJid, groupId) {
    const existingActive = await TicTacToe.findOne({
        $or: [{ 'player1.jid': senderJid }, { 'player2.jid': senderJid }],
        status: 'active'
    });
    if (existingActive) return { error: 'You are already in an active game. Use ttt end to leave.' };

    const existingWaiting = await TicTacToe.findOne({
        'player1.jid': senderJid, status: 'waiting'
    });
    if (existingWaiting) return { error: 'You already have a waiting game. Use ttt end to cancel it.' };

    const roomId = uuidv4().split('-')[0];
    const game = new TicTacToe({ 
        roomId, groupId,
        player1: { jid: senderJid, symbol: '❌' },
        player2: { jid: null, symbol: '⭕' },
        currentTurn: senderJid, 
        board: Array(9).fill(' '), 
        status: 'waiting',
        timeoutAt: new Date(Date.now() + 5 * 60 * 1000),
        isAI: false  // Default false
    });

    await game.save();
    const timeout = setTimeout(async () => {
        const g = await TicTacToe.findOne({ roomId, status: 'waiting' });
        if (g) { g.status = 'ended'; await g.save(); }
        activeTimeouts.delete(roomId);
    }, 5 * 60 * 1000);

    activeTimeouts.set(roomId, timeout);
    return { success: true, roomId };
}

async function joinGame(senderJid, groupId) {
    const game = await TicTacToe.findOne({
        groupId, status: 'waiting', 'player2.jid': null, 'player1.jid': { $ne: senderJid }
    });

    if (!game) return { error: 'No available game to join in this group.' };
    if (game.player1.jid === senderJid) return { error: '🚫 You cannot join your own game.' };

    game.player2.jid = senderJid; 
    game.status = 'active';
    game.currentTurn = game.player1.jid; 
    game.isAI = false;  // Explicitly set for human join
    await game.save();

    if (activeTimeouts.has(game.roomId)) {
        clearTimeout(activeTimeouts.get(game.roomId));
        activeTimeouts.delete(game.roomId);
    }

    return { success: true, roomId: game.roomId, board: game.board, player1: game.player1, player2: game.player2 };
}

async function makeMove(senderJid, position) {
    const game = await TicTacToe.findOne({
        $or: [{ 'player1.jid': senderJid }, { 'player2.jid': senderJid }],
        status: 'active'
    }).select('player1 player2 currentTurn board status isAI roomId groupId');  // Include isAI

    if (!game) return { error: 'You are not in an active game.' };
    if (senderJid !== game.currentTurn) { 
        return { error: '⏳ Wait for your turn!' };  
    }
    
    const idx = position - 1;
    if (idx < 0 || idx > 8 || game.board[idx] !== ' ') { 
        return { error: '⚠️ Invalid move. Choose an empty position (1-9)' }; 
    }
    
    const symbol = senderJid === game.player1.jid ? '❌' : '⭕';
    game.board[idx] = symbol;

    const result = checkWinner(game.board);
    if (result === '❌' || result === '⭕') {
        game.status = 'ended'; 
        await game.save();
        const winner = senderJid === game.player1.jid ? game.player1 : game.player2;
        return {
            status: 'win',
            winnerJid: senderJid,
            winnerName: winner.name || `Player ${senderJid === game.player1.jid ? '1' : '2'}`,
            board: game.board,
            winnerPrefix: winner.jid.split('@')[0]
        };
    }
    else if (result === 'draw') { 
        game.status = 'ended'; 
        await game.save(); 
        return { status: 'draw', board: game.board }; 
    }

    // Switch turn
    game.currentTurn = senderJid === game.player1.jid ? game.player2.jid : game.player1.jid;
    await game.save();
    
    const nextPlayer = game.currentTurn === game.player1.jid ? game.player1 : game.player2;
    return { 
        status: 'continue', 
        board: game.board, 
        nextPlayer: { 
            jid: nextPlayer.jid,
            name: nextPlayer.name || `Player ${nextPlayer === game.player1 ? '1' : '2'}`,
            symbol: nextPlayer === game.player1 ? '❌' : '⭕' 
        },
        isAI: game.isAI || false,
        groupId: game.groupId
    };
}

async function endGame(senderJid) {
    const game = await TicTacToe.findOne({
        $or: [{ 'player1.jid': senderJid }, { 'player2.jid': senderJid }],
        status: { $ne: 'ended' }
    });

    if (!game) return { error: 'Game not found' };
    game.status = 'ended';  
    await game.save();

    if (activeTimeouts.has(game.roomId)) {
        clearTimeout(activeTimeouts.get(game.roomId));
        activeTimeouts.delete(game.roomId);
    }
    return { success: true };
}

// 🔥 NEW: Handle AI move immediately after human move
async function handleAIMove(Bloom, groupId, board) {
    try {        
        const game = await TicTacToe.findOne({ 
            groupId: groupId, 
            status: 'active',
            'player2.jid': 'luna_ai'
        });

        if (!game || game.currentTurn !== 'luna_ai') {
            return;
        }

        const aiMove = getAIMove(game.board);

        const result = await makeMove('luna_ai', aiMove);
        const boardText = renderBoard(result.board);
        
        // ✅ ADD PLAYER INFO LINE
        const player1Name = game.player1.jid.split('@')[0];
        const playerInfo = `❌ @${player1Name}    ⭕ Luna AI`;
        
        if (result.status === 'win') {
            await Bloom.sendMessage(groupId, { 
                text: `🤖 *Luna AI wins!* 🎉\n\n${boardText}\n\n${playerInfo}`,
                mentions: [game.player1.jid]
            });
        } else if (result.status === 'draw') {
            await Bloom.sendMessage(groupId, { 
                text: `🤝 Game ended in draw!\n\n${boardText}\n\n${playerInfo}`,
                mentions: [game.player1.jid]
            });
        } else {
            await Bloom.sendMessage(groupId, { 
                text: `🤖 Luna AI plays ${aiMove}\n\n${boardText}\n\n${playerInfo}\n\n🎯 Your turn! (1-9)`,
                mentions: [game.player1.jid]
            });
        }
    } catch (e) {
        console.error('AI Move Error:', e);
    }
}


async function tttmove(Bloom, message, fulltext) {
    try {
        const sender = message.key.participant || message.key.remoteJid;
        const group = message.key.remoteJid;
        const move = parseInt(fulltext.trim());

        if (isNaN(move) || move < 1 || move > 9) {
            return await Bloom.sendMessage(group, { text: '⚠️ Please enter a number between 1-9' });
        }

        // 1. Process human move FIRST
        const result = await makeMove(sender, move);
        if (result.error) { 
            return await Bloom.sendMessage(group, { text: result.error }); 
        }

        const boardText = renderBoard(result.board);

        // 2. ✅ AI GAME CHECK - Only if it's AI game AND now AI's turn
        const game = await TicTacToe.findOne({ 
            groupId: group, 
            status: 'active',
            'player2.jid': 'luna_ai'
        }).select('isAI player2.jid currentTurn');

        if (result.status === 'continue' && game && game.player2.jid === 'luna_ai') {
            // Human just moved, now AI responds
            await Bloom.sendMessage(group, { 
                text: `🤖 Luna AI thinking... ⏳` 
            });
            await handleAIMove(Bloom, group, result.board);
            return; // Exit after AI move
        }

        // 3. Original human vs human flow (unchanged)
        if (result.status === 'win') {
            await Bloom.sendMessage(group, {
                text: `🎉 @${result.winnerPrefix} (${result.winnerName}) wins!\n\n${boardText}`,
                mentions: [result.winnerJid]
            });
            await endGame(sender);
        }
        else if (result.status === 'draw') {
            await Bloom.sendMessage(group, { text: `🤝 Game ended in draw!\n\n${boardText}` });
            await endGame(sender);
        }
        else {
            await Bloom.sendMessage(group, {
                text: `${boardText}\n\n🎯 @${result.nextPlayer.jid.split('@')[0]}'s turn (${result.nextPlayer.symbol})`,
                mentions: [result.nextPlayer.jid]
            });
        }

    } catch (err) {
        console.error('TTT Move Error:', err);
        const group = message?.key?.remoteJid;
        if (group) {
            await Bloom.sendMessage(group, { text: '⚠️ An error occurred during the move' });
        }
    }
}

async function cleanupStaleGames() {
    try {
        const now = new Date();
        const waitingResult = await TicTacToe.deleteMany({
            status: 'waiting', timeoutAt: { $lt: now }
        });
        const endedResult = await TicTacToe.deleteMany({
            status: { $in: ['ended', 'active'] },
            updatedAt: { $lt: new Date(now - 24 * 60 * 60 * 1000) }
        });
        console.log(`♻️ Cleaned: ${waitingResult.deletedCount} waiting, ${endedResult.deletedCount} ended games`);
    } catch (err) {
        console.error('❌ Cleanup error:', err);
    }
}

function initializeCleanup() {
    cron.schedule('*/20 * * * *', cleanupStaleGames);
    console.log('🔄 Cleanup scheduled: every 20 minutes');
}

function startReminderChecker(Bloom) {
    setInterval(async () => {
        const now = new Date();
        const dueReminders = await Reminder.find({ remindAt: { $lte: now }, reminded: false });
        for (const r of dueReminders) {
            try {
                await Bloom.sendMessage(r.userId, { text: `⏰ Reminder: ${r.text}` });
                r.reminded = true;
                await r.save();
            } catch (e) { console.error('Failed to send reminder:', e); }
        }
    }, 60000);
}

initializeCleanup();
module.exports = { createGame, joinGame, makeMove, endGame, renderBoard, checkWinner, cleanupStaleGames, tttmove, startReminderChecker };