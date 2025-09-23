const { emojis } = require('../colors/react');
async function startStatusWatcher(Bloom, log) {
    const viewedStatusIds = new Set();

    setInterval(async () => {
        try {
            const statusList = await Bloom.chatRead('status@broadcast'); // Fetch status updates
            if (!statusList?.messages) return;

            for (const status of statusList.messages) {
                const keyId = status.key.id;
                const sender = status.key.participant || status.key.remoteJid;

                if (viewedStatusIds.has(keyId)) continue;
                viewedStatusIds.add(keyId);

                try {
                    // Simulate view
                    await Bloom.readMessages([{ remoteJid: 'status@broadcast', id: keyId }]);
                    log(`👁️ Viewed status from ${sender}`);

                    // React with emoji
                    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                    await Bloom.sendMessage(sender, {
                        react: {
                            text: emoji,
                            key: status.key
                        }
                    });
                    log(`💬 Reacted to ${sender}'s status with ${emoji}`);
                } catch (err) {
                    log('❌ Failed during status view/react:', err.message);
                }
            }

        } catch (err) {
            log('❌ Failed to fetch statuses:', err.message);
        }
    }, 5000); // check every 5 seconds
}
module.exports = { startStatusWatcher };