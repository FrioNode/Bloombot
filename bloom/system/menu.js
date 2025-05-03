module.exports = {
    menu: {
        type: 'system',
        desc: 'Shows a list of all available command names grouped by type',
        run: async (Bloom, message, fulltext, commands) => {
            const grouped = {};

            for (const [name, cmd] of Object.entries(commands)) {
                const type = cmd.type || 'misc';
                if (!grouped[type]) grouped[type] = [];
                grouped[type].push(name);
            }

            let menuText = '📜 *Command Menu*\n';
            for (const [type, names] of Object.entries(grouped)) {
                menuText += `\n🔹 *${type.toUpperCase()}*\n`;
                menuText += names.map(n => `› ${n}`).join('\n') + '\n';
            }

            await Bloom.sendMessage(message.key.remoteJid, { text: menuText });
        }
    }
};