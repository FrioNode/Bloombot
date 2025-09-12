const { isBloomKing } = require('../../colors/auth');
const mess = require('../../colors/mess');
module.exports = {
    bc: {
        type: 'utility',
        desc: 'Send broadcast to all participating groups',
        usage: 'bc <message>',
        run: async (Bloom, message, fulltext) => {
            // console.log('Bloom object keys:', Object.keys(Bloom));
            const sender = message.key.remoteJid;
            const senderid = message.key.participant;

            console.log(sender, senderid);
            if (!isBloomKing(sender, message)) {
                return await Bloom.sendMessage(sender, { text: mess.owner }, { quoted: message });
            }
            console.log(message.pushName);
            try {
                const args = fulltext.trim().split(' ');
                if (args.length < 2) {
                    return await Bloom.sendMessage(message.key.remoteJid, { text: 'Usage: bc <message>' });
                }
                const bcmess = args.slice(1).join(' ');
                const groups = await Bloom.groupFetchAllParticipating();
                if (!groups || Object.keys(groups).length === 0) {
                    return await Bloom.sendMessage(message.key.remoteJid, { text: 'You are not in any group... Join / Create groups to broadcast' });
                }

                for (const groupId of Object.keys(groups)) {
                   await Bloom.sendMessage(groupId, { text: `_Incomming Broadcast From_ *${message.pushName}* \n${bcmess}` });
                }

                await Bloom.sendMessage(message.key.remoteJid, { text: '✅ Broadcast sent to all groups.' });
            } catch (error) {
                console.error('Broadcast command error:', error);
                await Bloom.sendMessage(message.key.remoteJid, { text: '❌ Failed to send broadcast...' });
            }
        }
    }
};
