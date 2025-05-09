const { isGroupAdminContext } = require('../../colors/auth');
const { Settings } = require('../../colors/schema');

const toggles = {
    antilink: 'antiLink',
    noimage: 'noImage',
    game: 'gameEnabled',
    nsfw: 'nsfwEnabled',
};

module.exports = {
    antilink: {
        type: 'group',
        desc: 'Toggle Anti-Link protection',
        usage: 'antilink on/off',
        run: async (Bloom, message, fulltext) =>
        toggleSetting(Bloom, message, fulltext, 'antilink')
    },
    noimage: {
        type: 'group',
        desc: 'Toggle image restrictions',
        usage: 'noimage on/off',
        run: async (Bloom, message, fulltext) =>
        toggleSetting(Bloom, message, fulltext, 'noimage')
    },
    game: {
        type: 'group',
        desc: 'Toggle game commands',
        usage: 'game on/off',
        run: async (Bloom, message, fulltext) =>
        toggleSetting(Bloom, message, fulltext, 'game')
    },
    nsfw: {
        type: 'group',
        desc: 'Toggle NSFW commands',
        usage: 'nsfw on/off',
        run: async (Bloom, message, fulltext) =>
        toggleSetting(Bloom, message, fulltext, 'nsfw')
    }
};

async function toggleSetting(Bloom, message, fulltext, alias) {
    const jid = message.key.remoteJid;
    const arg = fulltext.split(' ')[1]?.toLowerCase();

    if (!await isGroupAdminContext(Bloom, message)) return;

    if (!['on', 'off'].includes(arg)) {
        return await Bloom.sendMessage(jid, { text: `❗ Usage: ${alias} on/off` });
    }

    const update = { [toggles[alias]]: arg === 'on' };

    await Settings.findOneAndUpdate(
        { group: jid },
        { $set: update },
        { new: true, upsert: true }
    );

    const status = arg === 'on' ? '✅ Enabled' : '🚫 Disabled';
    return await Bloom.sendMessage(jid, { text: `${status} ${alias}` });
}