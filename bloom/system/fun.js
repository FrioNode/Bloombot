module.exports = {
    fun: {
        type: 'system',
        desc: 'Lists all fun-type commands',
        run: async (Bloom, message, fulltext, commands) => {
            const funCmds = Object.entries(commands).filter(([_, cmd]) => cmd.type === 'fun');

            if (funCmds.length === 0) {
                await Bloom.sendMessage(message.key.remoteJid, { text: 'No fun commands available.' });
                return;
            }

            let text = '🎉 *Fun Commands*\n';
            for (const [name, cmd] of funCmds) {
                text += `• ${name}: ${cmd.desc || 'No description.'}\n`;
            }

            await Bloom.sendMessage(message.key.remoteJid, { text });
        }
    }
};