const { isGroupAdminContext } = require('../../colors/auth');
const { sudoChat } = require('../../colors/setup');
const mess = require('../../colors/mess');

module.exports = {
    purge: {
        type: 'group',
        desc: '💣 Wipes the group (demotes, kicks, locks, leaves)',
        run: async (Bloom, message, fulltext) => {
            const jid = message.key.remoteJid;
            const sender = message.key.participant || message.key.remoteJid;

            // ✅ Mandatory permission check
            const allowed = await isGroupAdminContext(Bloom, message);
            if (!allowed) return;

            // 🚨 Safety warning unless --no-warning is used
            if (!fulltext.includes('--no-warning')) {
                return await Bloom.sendMessage(jid, {
                    text: `⚠️ *DANGEROUS COMMAND: PURGE*\n\nThis will:\n• Demote all admins\n• Lock the group\n• Kick all members\n• Nullify name & description\n• Send a final message\n• Leave group\n\nTo proceed anyway, send:\n*purge --no-warning*`
                }, { quoted: message });
            }

            try {
                const metadata = await Bloom.groupMetadata(jid);
                const groupOwner = metadata.owner || metadata.participants.find(p => p.admin === 'superadmin')?.id;
                const botId = Bloom.user.id.split(':')[0] + '@s.whatsapp.net';

                // 🧹 Demote all admins (except owner and bot)
                for (const p of metadata.participants) {
                    if (p.admin && p.id !== groupOwner && p.id !== botId) {
                        await Bloom.groupParticipantsUpdate(jid, [p.id], 'demote').catch(e =>
                        console.warn(`⛔ Failed to demote ${p.id}: ${e.message}`)
                        );
                    }
                }

                // 🔒 Lock group
                await Bloom.groupSettingUpdate(jid, 'announcement');

                // 🔁 Revoke group invite
                await Bloom.groupRevokeInvite(jid);

                // 👢 Kick all members (except owner and bot)
                const toKick = metadata.participants
                .filter(p => p.id !== groupOwner && p.id !== botId)
                .map(p => p.id);

                for (const id of toKick) {
                    await Bloom.groupParticipantsUpdate(jid, [id], 'remove').catch(e =>
                    console.warn(`⛔ Failed to remove ${id}: ${e.message}`)
                    );
                }

                // 🚫 Reset name and description
                await Bloom.groupUpdateSubject(jid, 'null');
                await Bloom.groupUpdateDescription(jid, '');

                // 💬 Final message
                await Bloom.sendMessage(jid, {
                    text: '☢️ This group has been purged.\n\nI now return to the void.\n💀 Goodbye.'
                }, { quoted: message });

                // 🚪 Leave group
                await Bloom.groupLeave(jid);

            } catch (err) {
                console.error('❌ Purge error:', err);
                await Bloom.sendMessage(jid, { text: `❌ Purge failed:\n\`\`\`\n${err.message}\n\`\`\`` }, { quoted: message });
            }
        }
    }
};