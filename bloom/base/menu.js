const { get } = require('../../colors/setup');
const { mess } = require('../../colors/mess');
const { prepareWAMessageMedia, generateWAMessageFromContent, proto } = require('baileys');

module.exports = {
    menu: {
        type: 'user',
        desc: 'Shows all commands by type',
        usage: `Just type *menu*`,
        run: async (Luna, message, fulltext, commands) => {

            /* ───── Group commands ───── */
            const grouped = {};
            let total = 0;

            for (const [name, cmd] of Object.entries(commands)) {
                const type = (cmd.type || 'misc').toUpperCase();
                if (!grouped[type]) grouped[type] = [];
                grouped[type].push(name);
                total++;
            }

            const categories = Object.keys(grouped);

            // Split categories into 2 halves
            const mid = Math.ceil(categories.length / 2);
            const firstHalf = categories.slice(0, mid);
            const secondHalf = categories.slice(mid);

            const buildMenuText = (cats) => {
                let text = '';
                for (const cat of cats) {
                    const cmds = grouped[cat];
                    text += `> 📂 ${cat}\n╭─────────────────\n`;
                    for (let i = 0; i < cmds.length; i += 4) {
                        text += `│ ${cmds.slice(i, i + 4).join(' • ')}\n`;
                    }
                    text += `╰─────────────────\n`;
                }
                return text;
            };

            const botname = await get('BOTNAME');

            const pages = [
                buildMenuText(firstHalf),
                buildMenuText(secondHalf)
            ];

            /* ───── Build Carousel Cards ───── */
            const cards = [];
            const DEFAULT_IMAGE = await get('IMAGE');
            for (let i = 0; i < pages.length; i++) {
                const media = await prepareWAMessageMedia(
                    { image: { url: DEFAULT_IMAGE } },
                    { upload: Luna.waUploadToServer }
                );

                const header = proto.Message.InteractiveMessage.Header.create({
                    ...media,
                    title: `📜 ${botname} Menu (Total: ${total})`,
                    subtitle: `${botname} Menu Page ${i + 1} / 2`,
                    hasMediaAttachment: true
                });

                cards.push({
                    header,
                    body: { text: pages[i] },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({
                                    display_text: `${botname} Menu Page ${i + 1}`,
                                    id: `menu_page_${i + 1}`
                                })
                            }
                        ]
                    }
                });
            }

            /* ───── Send Carousel ───── */
            const carousel = generateWAMessageFromContent(
                message.key.remoteJid,
                {
                    viewOnceMessage: {
                        message: {
                            interactiveMessage: {
                                body: { text: '👉 Swipe left & right 2 view navigate\n' },
                                footer: { text: `${mess.footer}` },
                                carouselMessage: {
                                    cards,
                                    messageVersion: 1
                                }
                            }
                        }
                    }
                },
                { quoted: message }
            );

            await Luna.relayMessage(
                message.key.remoteJid,
                carousel.message,
                { messageId: carousel.key.id }
            );
        }
    },
    help: {
        type: 'user',
        desc: 'Shows help info. Usage: help [command]',
        usage: 'Just type: *help* or *help* <command> for specific plugin',
        run: async (Luna, message, fulltext, commands) => {
            const args = fulltext.trim().split(' ').slice(1); // remove "help"

            if (args.length > 0) {
                const cmdName = args[0].toLowerCase();
                const cmd = commands[cmdName];
                if (!cmd) {
                    return await Luna.sendMessage(message.key.remoteJid, {
                        text: `❌ Command *${cmdName}* not found. Use *help* / *menu* to see all commands.`
                    });
                }

                const detailText = `🔍 *Help: ${cmdName}*\n\n` +
                `• Category: ${cmd.type || 'misc'}\n` +
                `• Description: ${cmd.desc || 'No description'}\n` +
                `• Usage: ${cmd.usage || cmdName}\n`;

                return await Luna.sendMessage(message.key.remoteJid, { text: detailText + mess.footer });
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

            await Luna.sendMessage(message.key.remoteJid, { text: helpText + mess.footer});
        }
    }
};