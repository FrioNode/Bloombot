const { Exp } = require('./schema');

async function trackUsage(jid) {
    if (!jid) return;
    try {
        await Exp.findOneAndUpdate(
            { jid },
            {
                $inc: {
                    points: 1,
                    messageCount: 1
                }
            },
            { upsert: true, new: true }
        );
    } catch (err) {
        console.error('❌ Error tracking user exp:', err);
    }
}

module.exports = { trackUsage };