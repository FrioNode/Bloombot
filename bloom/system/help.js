module.exports = {
    help: {
        type: 'user',
        desc: 'Shows help info. Usage: help [command]',
        usage: 'Just type: *help* or *help* <command> for specific plugin',
        run: async (Bloom, message, fulltext, commands) => {
            const args = fulltext.trim().split(' ').slice(1); // remove "help"

            if (args.length > 0) {
                const cmdName = args[0].toLowerCase();
                const cmd = commands[cmdName];
                if (!cmd) {
                    return await Bloom.sendMessage(message.key.remoteJid, {
                        text: `❌ Command *${cmdName}* not found. Use *help* / *menu* to see all commands.`
                    });
                }

                const detailText = `🔍 *Help: ${cmdName}*\n\n` +
                `• Category: ${cmd.type || 'misc'}\n` +
                `• Description: ${cmd.desc || 'No description'}\n` +
                `• Usage: ${cmd.usage || cmdName}`;

                return await Bloom.sendMessage(message.key.remoteJid, { text: detailText });
            }

            // Fallback to full help menu
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