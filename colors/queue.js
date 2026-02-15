const { createClient } = require("redis");
const pino = require("pino");
const log = pino();

class MessageQueue {
  constructor(redisUrl) {
    this.url = redisUrl;
    this.client = null;
    this.queueName = "whatsapp_payment_messages";
    this.isProcessing = false;
    this.processingInterval = null;
    this.lunaInstance = null;
    this.connect();
  }

  async connect() {
    try {
      this.client = createClient({ url: this.url });
      
      this.client.on("error", e => log.error({ e }, "Redis error"));
      this.client.on("connect", () => log.info("Redis connected for queue"));
      this.client.on("reconnecting", () => log.warn("Redis reconnecting"));
      
      await this.client.connect();
      return true;
    } catch (e) {
      log.error({ e }, "Failed to connect Redis");
      setTimeout(() => this.connect(), 5000);
      return false;
    }
  }

  async addMessage(sender, text, api_ref, metadata = {}) {
    if (!this.client) {
      log.error("Redis not connected, cannot queue message");
      return false;
    }

    try {
      const messageJob = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        sender,
        text,
        api_ref,
        metadata,
        timestamp: Date.now(),
        attempts: 0
      };

      // Add to queue (left push)
      await this.client.lPush(this.queueName, JSON.stringify(messageJob));
      
      log.info(`📦 Queued message for ${sender} (${api_ref})`);
      return true;
    } catch (e) {
      log.error({ e }, "Failed to queue message");
      return false;
    }
  }

  startProcessing(lunaInstance) {
    if (this.isProcessing) {
      log.warn("Queue processor already running");
      return;
    }

    this.lunaInstance = lunaInstance;
    this.isProcessing = true;

    // Process 1 message every 200ms (5 messages/second)
    this.processingInterval = setInterval(async () => {
      try {
        // Get message from queue (right pop)
        const messageJson = await this.client.rPop(this.queueName);
        if (!messageJson) return;

        const message = JSON.parse(messageJson);
        await this.processMessage(message);
      } catch (e) {
        log.error({ e }, "Error in queue processor");
      }
    }, 200); // 200ms interval = 5/second

    log.info("✅ Queue processor started (5 messages/second)");
  }

  async processMessage(message) {
    try {
      log.info(`🔄 Processing: ${message.api_ref} to ${message.sender}`);
      
      // Send the message using your LunaInstance
      await this.lunaInstance.sendMessage(message.sender, { text: message.text });
      
      log.info(`✅ Sent: ${message.api_ref}`);
      
      // Optional: Update database if needed
      if (message.metadata.updatePayment) {
        try {
          const Payment = require('./models/Payment');
          await Payment.updateOne(
            { api_ref: message.api_ref },
            { notified: true, updated: new Date() }
          );
        } catch (dbError) {
          log.error({ dbError }, "Failed to update payment status");
        }
      }
    } catch (error) {
      log.error(`❌ Failed to send ${message.api_ref}: ${error.message}`);
      
      // Retry logic (max 2 retries)
      if (message.attempts < 2) {
        message.attempts += 1;
        message.lastError = error.message;
        
        // Wait then re-add to queue
        setTimeout(async () => {
          try {
            await this.client.lPush(this.queueName, JSON.stringify(message));
            log.info(`🔄 Retry ${message.attempts} for ${message.api_ref}`);
          } catch (e) {
            log.error(`🔥 Failed to retry ${message.api_ref}: ${e.message}`);
          }
        }, 2000 * message.attempts); // 2s, 4s delay
      } else {
        log.error(`💀 Giving up on ${message.api_ref} after ${message.attempts} retries`);
      }
    }
  }

  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.isProcessing = false;
      log.info("🛑 Queue processor stopped");
    }
  }

  async getQueueLength() {
    if (!this.client) return 0;
    return await this.client.lLen(this.queueName);
  }

  async clearQueue() {
    if (!this.client) return;
    await this.client.del(this.queueName);
    log.info("🧹 Queue cleared");
  }
}

// Create single instance
let messageQueueInstance = null;

function getMessageQueue(redisUrl) {
  if (!messageQueueInstance) {
    messageQueueInstance = new MessageQueue(redisUrl);
  }
  return messageQueueInstance;
}

module.exports = { getMessageQueue };