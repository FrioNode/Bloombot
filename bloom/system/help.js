module.exports = {
    help: {
        type: 'system',
        desc: 'Shows help info for all commands, grouped by category',
        run: async (Bloom, message, fulltext, commands) => {
            const grouped = {};

            for (const [name, cmd] of Object.entries(commands)) {
                const type = cmd.type || 'misc';
                if (!grouped[type]) grouped[type] = [];
                grouped[type].push({ name, desc: cmd.desc || 'No description.' });
            }

            let helpText = '🛠 *Available Commands*\n';
            for (const [type, cmds] of Object.entries(grouped)) {
                helpText += `\n📂 *${type.toUpperCase()}*\n`;
                for (const { name, desc } of cmds) {
                    helpText += `• ${name}: ${desc}\n`;
                }
            }

            await Bloom.sendMessage(message.key.remoteJid, { text: helpText });
        }
    }
};