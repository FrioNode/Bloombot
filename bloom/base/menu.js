const { get } = require('../../colors/setup');
const { footer } = require('../../colors/mess');
module.exports = {
    menu: {
        type: 'user',
        desc: 'Shows all commands by type, or specific type if argument is provided',
        usage: `Just type *menu* or *menu* <submenu> for a specific menu\nEg: *menu group*`,
        run: async (Bloom, message, fulltext, commands) => {
            const grouped = {};
            let totalCommands = 0;

            // Group commands by type and count the total commands
            for (const [name, cmd] of Object.entries(commands)) {
                const type = cmd.type || 'misc';
                if (!grouped[type]) grouped[type] = [];
                grouped[type].push(name);
                totalCommands++; // Increment total count
            }

            // Check if there's an argument provided
            const args = fulltext.trim().split(' ');
            const category = args[1]?.toLowerCase();

            let menuText = '';

            // If no category argument is provided, show the full menu with total commands
            if (!category) {
                const botname = await get('BOTNAME');
                menuText += `📜 *${botname} Menu* (Total: ${totalCommands})\n\n`;
            }

            // If a category is provided, show only that category's commands
            if (category) {
                // Ensure the category exists
                if (!grouped[category]) {
                    return await Bloom.sendMessage(message.key.remoteJid, {
                        text: `❌ No commands found for category *${category}*.`
                    }, { quoted: message });
                }

                menuText += `📂 *${category.toUpperCase()}*\n╭─────────────\n`;
                const names = grouped[category];

                // Group the commands into 3 per line for this category
                for (let i = 0; i < names.length; i += 4) {
                    menuText += `│ ${names.slice(i, i + 4).join(' | ')}\n`;
                }

                menuText += `╰─────────────\n`;
            } else {
                // Show the full menu with categories
                Object.entries(grouped).forEach(([type, names]) => {
                    menuText += `📂 *${type.toUpperCase()}*\n╭─────────────\n`;
                    for (let i = 0; i < names.length; i += 4) {
                        menuText += `│ ${names.slice(i, i + 4).join(' | ')}\n`;
                    }
                    menuText += `╰─────────────\n`;
                });
            }
            const final = menuText + footer;
            await Bloom.sendMessage(message.key.remoteJid, { text: final }, { quoted: message });
        }
    },
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
                `• Usage: ${cmd.usage || cmdName}\n`;

                return await Bloom.sendMessage(message.key.remoteJid, { text: detailText + footer });
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

            await Bloom.sendMessage(message.key.remoteJid, { text: helpText + footer});
        }
    }
};