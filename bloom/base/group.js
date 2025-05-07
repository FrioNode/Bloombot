const { isGroupAdminContext } = require('../../colors/auth');
const mess = require('../../colors/mess');

module.exports = {
    add: {
        type: 'group',
        desc: 'Add a participant to the group',
        run: async (Bloom, message, fulltext) => {
            if (!await isGroupAdminContext(Bloom, message)) return;
            const arg = fulltext.split(' ')[1];
            const jid = arg + '@s.whatsapp.net';
            await Bloom.groupParticipantsUpdate(message.key.remoteJid, [jid], 'add');
            await Bloom.sendMessage(message.key.remoteJid, { text: '✅ Added successfully.' });
        }
    },

    kick: {
        type: 'group',
        desc: 'Remove a participant from the group',
        run: async (Bloom, message, fulltext) => {
            if (!await isGroupAdminContext(Bloom, message)) return;
            const arg = fulltext.split(' ')[1];
            let targetJid = arg ? `${arg}@s.whatsapp.net` :
            message.message?.extendedTextMessage?.contextInfo?.participant;
            if (!targetJid) return await Bloom.sendMessage(message.key.remoteJid, { text: '❌ Tag or provide a number to kick.' });

            await Bloom.groupParticipantsUpdate(message.key.remoteJid, [targetJid], 'remove');
            await Bloom.sendMessage(message.key.remoteJid, { text: `👢 Removed ${targetJid.split('@')[0]}` });
        }
    }
    ,

    open: {
        type: 'group',
        desc: 'Open group (anyone can send messages)',
        run: async (Bloom, message) => {
            if (!await isGroupAdminContext(Bloom, message)) return;
            await Bloom.groupSettingUpdate(message.key.remoteJid, 'not_announcement');
            await Bloom.sendMessage(message.key.remoteJid, { text: '🔓 Group is now open.' });
        }
    },

    close: {
        type: 'group',
        desc: 'Close group (only admins can send)',
        run: async (Bloom, message) => {
            if (!await isGroupAdminContext(Bloom, message)) return;
            await Bloom.groupSettingUpdate(message.key.remoteJid, 'announcement');
            await Bloom.sendMessage(message.key.remoteJid, { text: '🔒 Group is now closed.' });
        }
    },
    lock: {
        type: 'group',
        desc: 'Lock group settings (only admins can edit group info)',
        run: async (Bloom, message) => {
            if (!await isGroupAdminContext(Bloom, message)) return;

            await Bloom.groupSettingUpdate(message.key.remoteJid, 'locked');
            await Bloom.sendMessage(message.key.remoteJid, {
                text: '🔒 Group settings locked. Only admins can edit group info.'
            });
        }
    },
    unlock: {
        type: 'group',
        desc: 'Unlock group settings (any member can edit group info)',
        run: async (Bloom, message) => {
            if (!await isGroupAdminContext(Bloom, message)) return;

            await Bloom.groupSettingUpdate(message.key.remoteJid, 'unlocked');
            await Bloom.sendMessage(message.key.remoteJid, {
                text: '🔓 Group settings unlocked. Members can now edit group info.'
            });
        }
    },

    disap: {
        type: 'group',
        desc: 'Set disappearing messages:\n(0=off, 24=1 day, 7=1 week, 90=3 months)',
        run: async (Bloom, message, fulltext) => {
            if (!await isGroupAdminContext(Bloom, message)) return;

            const parts = fulltext.trim().split(' ');
            const input = parseInt(parts[1]); // e.g., !disappear 24

            const durations = {
                0: 0,
                24: 86400,
                7: 604800,
                90: 7776000
            };

            if (!durations.hasOwnProperty(input)) {
                return await Bloom.sendMessage(message.key.remoteJid, {
                    text: '❗ Invalid value. Use: 0 (off), 24, 7, or 90'
                });
            }

            await Bloom.sendMessage(message.key.remoteJid, { disappearingMessagesInChat: durations[input] });
            const statusMsg = input === 0 ? '❌ Disappearing messages disabled' : `💨 Disappearing messages set to ${input} hour(s)/day(s).`;
            await Bloom.sendMessage(message.key.remoteJid, { text: statusMsg });
        }
    },

    rename: {
        type: 'group',
        desc: 'Change group subject',
        run: async (Bloom, message, fulltext) => {

            if (!await isGroupAdminContext(Bloom, message)) return;
            const newName = fulltext.split(' ').slice(1).join(' ').trim();
            if (!newName) return Bloom.sendMessage(message.key.remoteJid, { text: '❌ Please provide a new name.' });
            await Bloom.groupUpdateSubject(message.key.remoteJid, newName);
            await Bloom.sendMessage(message.key.remoteJid, { text: `✏️ Group name updated to:\n\n${newName}` });
        }
    },

    desc: {
        type: 'group',
        desc: 'Change group description',
        run: async (Bloom, message, fulltext) => {
            if (!await isGroupAdminContext(Bloom, message)) return;
            const de = fulltext.split(' ').slice(1).join(' ').trim();
            if (!de) return Bloom.sendMessage(message.key.remoteJid, { text: '❌ Please provide a new description.' });
            await Bloom.groupUpdateDescription(message.key.remoteJid, de);
            await Bloom.sendMessage(message.key.remoteJid, { text: `📄 Description updated to.\n\n${de}` });
        }
    },

    revoke: {
        type: 'group',
        desc: 'Revoke group invite link',
        run: async (Bloom, message) => {
            if (!await isGroupAdminContext(Bloom, message)) return;
            await Bloom.groupRevokeInvite(message.key.remoteJid);
            await Bloom.sendMessage(message.key.remoteJid, { text: '🔗 Invite link revoked.' });
        }
    },
        revoke: {
            type: 'group',
            desc: 'Revoke current group invite link',
            run: async (Bloom, message, fulltext) => {
                if (!await isGroupAdminContext(Bloom, message)) return;

                try {
                    const code = await Bloom.groupRevokeInvite(message.key.remoteJid);
                    await Bloom.sendMessage(message.key.remoteJid, {
                        text: `🔁 Group invite link has been revoked.\n\n🆕 New Link: https://chat.whatsapp.com/${code}`
                    });
                } catch (err) {
                    await Bloom.sendMessage(message.key.remoteJid, { text: `❌ Failed to revoke link.` });
                    console.error('Revoke error:', err);
                }
            }
        },
            poll: {
                type: 'group',
                desc: 'Creates a poll in the group (admin only)',
                usage: 'poll Question | Option 1 | Option 2 | ...',
                run: async (Bloom, message, fulltext) => {
                    if (!await isGroupAdminContext(Bloom, message)) return;

                    const groupId = message.key.remoteJid;
                    const pollText = fulltext.trim().split(' ').slice(1).join(' ').trim(); // remove 'poll'

                    const segments = pollText.split('|').map(s => s.trim()).filter(Boolean);

                    if (segments.length < 2) {
                        return await Bloom.sendMessage(groupId, {
                            text: '❌ Invalid format.\nUsage: poll Question | Option 1 | Option 2 | ...'
                        }, { quoted: message });
                    }

                    const pollName = segments[0];
                    const pollOptions = segments.slice(1);

                    if (pollOptions.length < 2) {
                        return await Bloom.sendMessage(groupId, {
                            text: '❌ A poll requires at least 2 options.'
                        }, { quoted: message });
                    }

                    try {
                        await Bloom.sendMessage(groupId, {
                            poll: {
                                name: pollName,
                                values: pollOptions,
                                selectableCount: 1,
                                toAnnouncementGroup: false
                            }
                        });
                    } catch (error) {
                        console.error('Poll error:', error);
                        await Bloom.sendMessage(groupId, {
                            text: '❌ Failed to create poll.'
                        }, { quoted: message });
                    }
                }
            },
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