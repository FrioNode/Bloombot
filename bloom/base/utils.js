const QRCode = require('qrcode');
const sharp = require('sharp');
const { downloadMediaMessage } = require('baileys');
const { Jimp } = require("jimp");
const jsQR = require('jsqr');
const { get } = require('../../colors/setup');

let mess, logschat, Ticket, TicketId, connectDB, isBloomKing, getCurrentDate, Reminder;

async function initModules() {
    try {
        mess = require('../../colors/mess');
        ({ Ticket, TicketId, Reminder, connectDB } = require('../../colors/schema'));
        ({ isBloomKing } = require('../../colors/auth'));

        const moment = require('moment-timezone');
        const timezone = await get('TIMEZONE');

        getCurrentDate = () => moment().tz(timezone).format('MMMM Do YYYY, h:mm:ss a');

    } catch (err) {
        console.error('❌ Module pre-load error:', err.message);
        getCurrentDate = () => new Date().toLocaleString(); // fallback
    }
}

// Immediately run the async initializer
initModules();

module.exports = {
  ticket: {
    type: 'utility',
    desc: 'Create, check, list, mark or delete ticket(s)',
    usage: `ticket - (to list all tickets)
    ticket <issue> - to create new ticket
    ticket <ticketID> - check ticket details
    ticket <ticketID> <del/ongoing/resolved> - to delete or mark as ongoing/resolved`,
    run: async (Bloom, message, fulltext) => {
      if (!getCurrentDate) await initModules();
      const sender = message.key.remoteJid;
      const authorized = isBloomKing(sender, message);

      if (sender?.endsWith('@g.us') && !authorized) {
        await Bloom.sendMessage(sender, { text: `❌ Ticket module works in private chats only, unless you are the bot admin.` }, { quoted: message });
        return;
      }

      const parts = fulltext.trim().split(' ');
      const arg = parts[1] || '';
      const value = parts[2] || '';
      const ticketIdPattern = /^BB-\d{4}[A-Z]$/;

      if (!arg) {
        await list(Bloom, sender, authorized);
      } else if (ticketIdPattern.test(arg)) {
        if (!value) {
          await check(Bloom, message, arg, sender, authorized);
        } else if (value === 'del') {
          await del(Bloom, message, arg, sender, authorized);
        } else if (['ongoing', 'resolved'].includes(value)) {
          await mark(Bloom, message, arg, value, sender, authorized);
        } else {
          await Bloom.sendMessage(sender, { text: `❌ Invalid action.` });
        }
      } else {
        await create(Bloom, message, fulltext, sender);
      }
    }
  },
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
  },
    qr: {
    type: 'utility',
    desc: 'Generate QR code from text or decode QR code from image',
    usage: 'qr <text> OR reply to an image with qr',
    run: async (Bloom, message, fulltext) => {
      const sender = message.key.remoteJid;
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const stanzaId = message.message?.extendedTextMessage?.contextInfo?.stanzaId;
      const contextKey = message.message?.extendedTextMessage?.contextInfo?.participant || message.key.remoteJid;

      if (quoted?.imageMessage) {
        try {
          const fullQuotedMsg = {
            key: {
              remoteJid: contextKey,
              id: stanzaId || message.key.id,
              fromMe: false,
              participant: contextKey,
            },
            message: quoted
          };

          const buffer = await downloadMediaMessage(
            fullQuotedMsg,
            'buffer',
            {},
            { reuploadRequest: Bloom.updateMediaMessage }
          );

          const image = await Jimp.read(buffer);
          image.greyscale().contrast(0.5).normalize();

          const qrCode = jsQR(
            new Uint8ClampedArray(image.bitmap.data),
                              image.bitmap.width,
                              image.bitmap.height
          );

          if (qrCode) {
            await Bloom.sendMessage(sender, {
              text: `📷 *QR Code Decoded*\n────────────────\n${qrCode.data}\n────────────────\n✅ Successfully decoded with jsQR`
            }, { quoted: message });
          } else {
            throw new Error('No QR code found by jsQR');
          }
        } catch (err) {
          console.error('QR decode error:', err.message);
          await Bloom.sendMessage(sender, {
            text: '❌ No QR code detected or failed to decode.\n💡 Make sure:\n• The image contains a clear QR code\n• The QR code is not too small\n• The image is not blurry\n• Try a different QR code image'
          }, { quoted: message });
        }
        return;
      }

      // QR generation mode (text to QR)
      const text = fulltext.split(' ').slice(1).join(' ').trim();
      if (!text) {
        await Bloom.sendMessage(sender, {
          text: '❓ Please provide text to generate QR code OR reply to an image to decode QR.\n💡 Example: `qr https://example.com`\n💡 Or reply to a QR image with `qr`'
        }, { quoted: message });
        return;
      }

      try {
        const qrDataUrl = await QRCode.toDataURL(text, {
          width: 300,
          margin: 1,
          errorCorrectionLevel: 'L',
          color: { dark: '#000000', light: '#FFFFFF' }
        });

        const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        await Bloom.sendMessage(sender, {
          image: buffer,
          caption: `✅ *QR Code Generated*\n📝 Content: ${text}\n────────────────\n💡 Scan this QR code with any scanner app.`
        }, { quoted: message });

      } catch (err) {
        console.error('QR generation error:', err);
        await Bloom.sendMessage(sender, {
          text: `❌ QR generation failed:\n${err.message}\n\n💡 Try simpler text.`
        }, { quoted: message });
      }
    }
  },
  sticker: {
  type: 'utility',
  desc: 'Convert an image to a WhatsApp sticker',
  usage: 'sticker OR reply to an image with sticker',
  run: async (Bloom, message, fulltext) => {
    const sender = message.key.remoteJid;
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const stanzaId = message.message?.extendedTextMessage?.contextInfo?.stanzaId;
    const contextKey = message.message?.extendedTextMessage?.contextInfo?.participant || message.key.remoteJid;

    // Require user to reply to an image OR send an image with caption "sticker"
    let isImage = false;
    let msgImage = null;

    // User replied to an image
    if (quoted?.imageMessage) {
      isImage = true;
      msgImage = quoted;
    }

    // User sent image directly with caption "sticker"
    if (message.message?.imageMessage) {
      const caption = message.message?.imageMessage?.caption || "";
      if (/sticker/i.test(caption)) {
        isImage = true;
        msgImage = message.message;
      }
    }

    if (!isImage) {
      await Bloom.sendMessage(sender, {
        text: '❓ Send an image with caption *sticker* OR reply to an image with the command.\nExample: `sticker`'
      }, { quoted: message });
      return;
    }

    try {
      // Build full message to download buffer
      const fullQuotedMsg = {
        key: { remoteJid: contextKey, id: stanzaId || message.key.id,
          fromMe: false, participant: contextKey,  },
        message: msgImage
      };

      const buffer = await downloadMediaMessage(
        fullQuotedMsg,
        'buffer',
        {},
        { reuploadRequest: Bloom.updateMediaMessage }
      );

      // === Convert to WebP Sticker ===
      const webpBuffer = await sharp(buffer)
        .resize(512, 512, { fit: 'cover' })
        .toFormat('webp')
        .toBuffer();

      // OPTIONAL metadata
      const { Sticker, StickerTypes } = require('wa-sticker-formatter');
      const sticker = new Sticker(webpBuffer, {
        pack: 'FrioNode',
        author: 'Luna',
        type: StickerTypes.FULL,
        quality: 75
      });

      const stickerBuffer = await sticker.toBuffer();

      // === Send sticker ===
      await Bloom.sendMessage(sender, {
        sticker: stickerBuffer
      }, { quoted: message });

    } catch (err) {
      console.error('Sticker error:', err);
      await Bloom.sendMessage(sender, {
        text: `❌ Failed to make sticker:\n${err.message}`
      }, { quoted: message });
    }
  }
}
  };

// ===== Sub-functions ===== //

async function create(Bloom, message, fulltext, senderJid) {
  const realSender = message.key.participant || senderJid;
  const args = fulltext.trim().split(' ');
  const issue = args.slice(1).join(' ');

  if (!issue) {
    await Bloom.sendMessage(senderJid, { text: mess.ticketarg }, { quoted: message });
    return;
  }

  try {
    await connectDB('Create Ticket');

    const openTicketCount = await Ticket.countDocuments({ user: realSender, status: { $in: ['open', 'ongoing'] } });
    if (openTicketCount >= 3) {
      await Bloom.sendMessage(senderJid, { text: mess.limited });
      return;
    }

    const id = await TicketId();
    const newTicket = { id, issue, user: realSender, status: 'open' };

    await Ticket.create(newTicket);
    const date = getCurrentDate();

    await Bloom.sendMessage(senderJid, {
      text: `╭──── 🧠\n│ _Ticket ID: ${id}_\n│ _status: ${newTicket.status}_\n│ *Use:* !ticket ${id} to track.\n╰──── 🚀`,
    }, { quoted: message });
    const openchat = await get('OPENCHAT');
    await Bloom.sendMessage(openchat, {
      text: `╭──── 🧠\n│ User: ${realSender.split('@')[0]} raised a ticket\n│ ID: ${id}\n│ Date: ${date}\n╰──── 🚀\n> Message: _${issue}_`,
    });

  } catch (error) {
    console.error(`Error creating ticket:`, error);
    const logchat = await get('OPENCHAT');
    await Bloom.sendMessage(logchat, { text: `❌ Failed to create ticket: ${error}` });
  }
}


async function list(Bloom, sender, isAdmin) {
  try {
    await connectDB('List Tickets');
    const tickets = isAdmin
    ? await Ticket.find().sort({ createdAt: -1 }).lean()
    : await Ticket.find({ user: sender }).sort({ createdAt: -1 }).lean();

    if (!tickets.length) {
      await Bloom.sendMessage(sender, {
        text: isAdmin
        ? '🟡 No tickets found.'
        : '🟢 You have no open tickets.\nSend *!ticket your issue* to create one.',
      });
      return;
    }

    let output = isAdmin ? `🗂 All tickets:\n` : `📋 Your tickets:\n`;
    for (const t of tickets) {
      output += isAdmin
      ? `\n🔹 ID: ${t.id}\n👤 User: ${t.user.split('@')[0]}\n📌 Status: ${t.status}\n🕒 Created: ${new Date(t.createdAt).toLocaleString()}\n`
      : `\n🆔 *${t.id}* | Status: ${t.status}`;
    }

    if (!isAdmin) {
      output += `\n\nView a ticket: *!ticket <ticket_id>*\nDelete: *!ticket <ticket_id> del*`;
    }

    await Bloom.sendMessage(sender, { text: output });

  } catch (err) {
    console.error('Error listing tickets:', err);
    await Bloom.sendMessage(sender, { text: `❌ Error listing tickets: ${err}` });
  }
}

async function check(Bloom, message, ticketId, sender, isAdmin) {
  try {
    await connectDB('Check tickets');
    const ticket = await Ticket.findOne(isAdmin ? { id: ticketId } : { id: ticketId, user: sender });

    if (!ticket) {
      await Bloom.sendMessage(sender, { text: '❌ Ticket not found.' }, { quoted: message });
      return;
    }

    await Bloom.sendMessage(sender, {
      text: `🧾 Ticket: ${ticket.id}\n🗒 Issue: ${ticket.issue}\n📌 Status: ${ticket.status}\n🕒 Created: ${new Date(ticket.createdAt).toLocaleString()}`
    }, { quoted: message });

  } catch (err) {
    console.error('Error checking ticket:', err);
    await Bloom.sendMessage(sender, { text: `❌ Failed to fetch ticket: ${err}` });
  }
}

async function del(Bloom, message, ticketId, sender, isAdmin) {
  try {
    await connectDB('delete Ticket');
    const result = await Ticket.deleteOne(isAdmin ? { id: ticketId } : { id: ticketId, user: sender });

    if (!result.deletedCount) {
      await Bloom.sendMessage(sender, { text: '❌ Ticket not found or no permission.' }, { quoted: message });
      return;
    }

    await Bloom.sendMessage(sender, { text: `🗑️ Ticket ${ticketId} deleted.` }, { quoted: message });

  } catch (err) {
    console.error('Error deleting ticket:', err);
    const logschat = await get('OPENCHAT');
    await Bloom.sendMessage(logschat, { text: `❌ Error deleting ticket ${ticketId}: ${err}` });
  }
}

async function mark(Bloom, message, ticketId, status, sender, isAdmin) {
  if (!['ongoing', 'resolved'].includes(status)) {
    await Bloom.sendMessage(sender, { text: '❌ Invalid status.' }, { quoted: message });
    return;
  }

  try {
    await connectDB('Mark Ticket');
    const ticket = await Ticket.findOne({ id: ticketId });

    if (!ticket) {
      await Bloom.sendMessage(sender, { text: '❌ Ticket not found.' }, { quoted: message });
      return;
    }

    if (!isAdmin && ticket.user !== sender) {
      await Bloom.sendMessage(sender, { text: '🚫 Not authorized.' }, { quoted: message });
      return;
    }

    ticket.status = status;
    await ticket.save();

    await Bloom.sendMessage(sender, { text: `🔄 Ticket ${ticketId} marked as *${status}*.` }, { quoted: message });

  } catch (err) {
    console.error('Error updating status:', err);
    await Bloom.sendMessage(sender, { text: `❌ Error: ${err.message}` }, { quoted: message });
  }
}