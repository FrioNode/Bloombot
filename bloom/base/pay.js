const { get } = require('../../colors/setup');
const IntaSend = require('intasend-node');
const { Payment } = require('../../colors/schema');

module.exports = {
    pay: {
        type: 'utility',
        desc: 'Trigger M-Pesa STK Push via lunapay (IntaSend)',
        usage: 'pay <amount> <phone_number>',
        run: async (Luna, message, fulltext) => {
            const sender = message.key.remoteJid;
            const args = fulltext.split(' ').slice(1);
            const amount = parseFloat(args[0]);
            const phone = args[1];
            const cleanPhone = phone.replace(/[^\d]/g, '').replace(/^0/, '254');
            
            if (!/^254\d{9}$/.test(cleanPhone)) {
                return Luna.sendMessage(sender, { 
                    text: '❌ Invalid phone. Use: 254712345678' 
                }, { quoted: message });
            }
            
            if (!amount || amount < 1) {
                return Luna.sendMessage(sender, { 
                    text: '❌ Usage: pay <amount> <phone>\nEx: pay 100 254712345678' 
                }, { quoted: message });
            }

            try {
                const secretKey = await get('INTASEND_SECRET_KEY');
                const publicKey = await get('INTASEND_PUBLISHABLE_KEY');
                const callbackUrl = await get('CALLBACK_URL');
                const api_ref = `LUNAPAY_${Date.now()}_${Math.random().toString(36).slice(-6)}`;
                const jid_type = message.key.remoteJid.endsWith('@g.us') ? 'group' : 'user';

                const intasend = new IntaSend(publicKey, secretKey);
                const collection = intasend.collection();
                
                // ✅ FIXED: Always store + send STK (no response check needed)
                await Payment.create({ 
                    api_ref, sender, jid_type, amount, 
                    phone: cleanPhone, status: 'pending' 
                });
                
                const response = await collection.mpesaStkPush({
                    first_name: 'Luna',
                    last_name: 'Customer',
                    email: `${cleanPhone}@lunapay.io`,
                    host: callbackUrl,
                    amount,
                    phone_number: cleanPhone,
                    api_ref,
                    currency: 'KES'
                });
                
                console.log('STK Response:', JSON.stringify(response, null, 2));
                
                await Luna.sendMessage(sender, {
                    text: `💰 *STK Push SENT!*\n\n💵 KES ${amount}\n📱 ${phone}\n🔗 \`${api_ref}\`\n\n⏳ Check M-Pesa menu now!`
                }, { quoted: message });
                
            } catch (error) {
                console.error('IntaSend FULL Error:', error);
                Luna.sendMessage(sender, {
                    text: `⚠️ STK Error: ${error.message || 'Try again'}`
                }, { quoted: message });
            }
        }
    },
};

const { getMessageQueue } = require('../../colors/queue'); 

// Initialize queue once (will be reused)
let messageQueue = null;
let queueInitialized = false;

module.exports._payWebhook = async function(LunaInstance, req, res) {
    try {
        const event = req.body;
        console.log('💰 Payment webhook:', event.state, event.api_ref || event.invoice_id);
        res.json({ received: true, processing: true });
        
        // Lazy initialize queue
        if (!queueInitialized) {
            const redisUrl = await get('REDIS');
            messageQueue = getMessageQueue(redisUrl);
            
            // Start processing messages with LunaInstance
            setTimeout(() => {
                if (messageQueue && !messageQueue.isProcessing) {
                    messageQueue.startProcessing(LunaInstance);
                }
            }, 1000);
            
            queueInitialized = true;
            console.log('📦 Message queue initialized');
        }
        
        const api_ref = event.api_ref || event.invoice_id;
        if (!api_ref) {
            console.log('⚠️ No API ref in webhook');
            return;
        }
        
        const findPayment = async () => {
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    console.log('⏰ Payment lookup timeout');
                    resolve(null);
                }, 3000);
                
                Payment.findOne({ api_ref })
                    .then(payment => {
                        clearTimeout(timeout);
                        resolve(payment);
                    })
                    .catch(err => {
                        clearTimeout(timeout);
                        console.error('❌ Payment lookup error:', err);
                        resolve(null);
                    });
            });
        };
        
        const payment = await findPayment();
        
        if (!payment) {
            console.log('❌ No payment found for:', api_ref);
            return;
        }
        
        const sender = payment.sender;
        const status = event.state?.toLowerCase();
        const amount = parseFloat(event.value || event.net_amount || payment.amount);
        const phone = event.account || payment.phone;
        
        // Update payment in DB (fire and forget - don't wait)
        Payment.updateOne({ api_ref }, {
            status: status === 'complete' ? 'complete' : status || 'processing',
            webhook_data: event,
            updated: new Date()
        }).catch(err => console.error('DB update error:', err));
        
        // Create message
        let text;
        if (status === 'complete') {
            text = `🎉 *PAYMENT SUCCESS!*\n\n💰 KES ${amount}\n📱 ${phone}\n🔗 ${api_ref}`;
        } else if (status === 'failed') {
            text = `❌ *PAYMENT FAILED*\n\n💰 KES ${amount}\n📱 ${phone}\n🔗 ${api_ref}\n📝 ${event.failed_reason || ''}`;
        } else {
            text = `⏳ *PAYMENT ${status?.toUpperCase() || 'PROCESSING'}*\n\n💰 KES ${amount}\n🔗 ${api_ref}`;
        }
        
        // Add to queue instead of sending directly
        if (messageQueue) {
            const queued = await messageQueue.addMessage(
                sender,
                text,
                api_ref,
                {
                    status: status,
                    amount: amount,
                    updatePayment: true
                }
            );
            
            if (queued) {
                console.log(`✅ Message queued for ${sender} (${api_ref})`);
            } else {
                console.log('⚠️ Queue failed, sending directly');
                // Fallback to direct send if queue fails
                await LunaInstance.sendMessage(sender, { text });
            }
        } else {
            // Fallback if queue not ready
            console.log('⚠️ Queue not ready, sending directly');
            await LunaInstance.sendMessage(sender, { text });
        }
        
    } catch (error) {
        console.error('🔥 Webhook processing error:', error);
        // Don't send error response - webhook already got OK
    }
};

// Optional: health check function
module.exports._getQueueStats = async function() {
    if (!messageQueue) {
        return { queue_active: false, length: 0 };
    }
    
    try {
        const length = await messageQueue.getQueueLength();
        return {
            queue_active: true,
            length: length,
            is_processing: messageQueue.isProcessing,
            rate_limit: "5 messages/second"
        };
    } catch (error) {
        return { queue_active: false, error: error.message };
    }
};