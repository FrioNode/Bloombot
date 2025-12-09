const { createClient } = require("redis");
const pino = require("pino");
const log = pino();

class RedisClient {
  constructor(url) {
    this.client = createClient({ url });
    this.client.on("error", e => log.error({ e }, "Redis error"));
    this.client.on("connect", () => log.info("Redis connected"));
    this.client.on("reconnecting", () => log.warn("Redis reconnecting"));
    this.connect();
  }
  async connect() { try { await this.client.connect() } catch(e){ log.error({ e }, "Failed to connect"); setTimeout(()=>this.connect(),1000) } }
  async get(k){ return this.exec(()=>this.client.get(k)) }
  async set(k,v,opts){ return this.exec(()=>this.client.set(k,v,opts)) }
  async del(k){ return this.exec(()=>this.client.del(k)) }
  async incr(k){ return this.exec(()=>this.client.incr(k)) }
  async ttl(k){ return this.exec(()=>this.client.ttl(k)) }
  async expire(k,seconds){ return this.exec(()=>this.client.expire(k,seconds)) }
  async exec(fn){ for(let i=0;i<5;i++){ try{return await fn()} catch(e){ log.error({ e },`Redis op failed, retry ${i+1}`); await new Promise(r=>setTimeout(r,Math.min(200*2**i,5000))) } } throw new Error("Redis operation failed after retries") }
}

module.exports = { RedisClient };