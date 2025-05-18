const { Reminder } = require('../../colors/schema');

module.exports = {
  reminder: {
    type: 'utility',
    desc: 'Set a reminder. time & message',
    usage: 'reminder 10 Take a break',
    run: async (Bloom, message, fulltext) => {
      try {
        const args = fulltext.trim().split(' ');
        if (args.length < 3) {
          return await Bloom.sendMessage(message.key.remoteJid, { text: 'Usage: reminder <minutes> <message>' });
        }

        const minutes = parseInt(args[1]);
        if (isNaN(minutes) || minutes <= 0) {
          return await Bloom.sendMessage(message.key.remoteJid, { text: 'Please provide a valid number of minutes.' });
        }

        const reminderText = args.slice(2).join(' ');
        const remindAt = new Date(Date.now() + minutes * 60000);

        // Save reminder to DB
        const newReminder = new Reminder({
          userId: message.key.participant || message.key.remoteJid,
          chatId: message.key.remoteJid,
          text: reminderText,
          remindAt
        });

        await newReminder.save();

        await Bloom.sendMessage(message.key.remoteJid, { text: `✅ Reminder set for ${minutes} minutes from now.` });

      } catch (error) {
        console.error('Reminder command error:', error);
        await Bloom.sendMessage(message.key.remoteJid, { text: '❌ Failed to set reminder.' });
      }
    }
  }
};
