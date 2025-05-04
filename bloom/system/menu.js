const { caption } = require('../../colors/mess');

module.exports = {
    menu: {
        type: 'system',
        desc: 'Shows all command names grouped by type, or specific type if argument is provided',
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
                menuText += `📜 *Command Menu* (Total Commands: ${totalCommands})\n\n`;
            }

            // If a category is provided, show only that category's commands
            if (category) {
                // Ensure the category exists
                if (!grouped[category]) {
                    return await Bloom.sendMessage(message.key.remoteJid, {
                        text: `❌ No commands found for category *${category}*.`
                    });
                }

                menuText += `📂 *${category.toUpperCase()}*\n╭──────────\n`;
                const names = grouped[category];

                // Group the commands into 3 per line for this category
                for (let i = 0; i < names.length; i += 3) {
                    menuText += `│ ${names.slice(i, i + 3).join(' | ')}\n`;
                }

                menuText += `╰──────────\n`;
            } else {
                // Show the full menu with categories
                Object.entries(grouped).forEach(([type, names]) => {
                    menuText += `📂 *${type.toUpperCase()}*\n╭──────────\n`;
                    for (let i = 0; i < names.length; i += 3) {
                        menuText += `│ ${names.slice(i, i + 3).join(' | ')}\n`;
                    }
                    menuText += `╰──────────\n`;
                });
            }
            const final = menuText + caption;
            await Bloom.sendMessage(message.key.remoteJid, { text: final });
        }
    }
};