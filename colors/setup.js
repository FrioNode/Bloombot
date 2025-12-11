// setup.js
const mongoose = require('mongoose');
const Bot = require('../package.json');
const dotenv = require('dotenv');
dotenv.config();

const mongoUri = process.env.MONGO || process.env.MONGO_URI;
if (!mongoUri) throw new Error('Mongo URI not defined in env');

let connected = false;

// ----- Simple key/value schema -----
const settingSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // key name
  value: { type: String, required: true } // always string
}, { collection: 'setup', versionKey: false });

const Setting = mongoose.model('Setup', settingSchema);

// ----- Connect to MongoDB -----
async function connectDB() {
  if (!connected) {
    await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 60000,
        socketTimeoutMS: 60000,
    });
    connected = true;
    console.log('[MongoDB] Connected via Mongoose');
  }
  return Setting;
}

// ----- Initialize Mongo with defaults -----
async function initDefaults() {
  const defaults = {
    SESSION: process.env.SESSION || 'x',
    MONGO: process.env.MONGO || 'mongodb://frio:node@localhost:27017/luna?authSource=admin',
    REDIS: process.env.REDIS || 'redis://localhost:6379',
    NODE: process.env.NODE || 'development',
    OWNERNUMBER: `${process.env.OWNERNUMBER || '254718241545'}@s.whatsapp.net`,
    SUDOLID: process.env.SUDOLID || '93282663153890@lid',
    DEVNAME: process.env.DEVNAME || 'FrioNode',
    OWNERNAME: process.env.OWNERNAME || 'Benson',
    OPENCHAT: process.env.OPENCHAT || '120363154923982755@g.us',
    INVITE: process.env.INVITE || 'DOhndqrd7RJAGxJ7z0wP7g',
    CHANNELID: process.env.CHANNELID || '120363321675231023@newsletter',
    CHANNEL: process.env.CHANNEL || 'https://whatsapp.com/channel/0029VagLDl6BFLgUIWV9aV2d',
    BOTNAME: process.env.BOTNAME || 'Luna',
    IMAGE: process.env.IMAGE || 'https://raw.githubusercontent.com/FrioNode/Bloombot/main/colors/luna.png',
    LANG: process.env.LANG || 'EN',
    REACT: process.env.REACT || 'false',
    EMOJI: process.env.EMOJI || '🌘',
    REBOOT: process.env.REBOOT === 'true' ? 'true' : 'false',
    IS_DOCKER: process.env.IS_DOCKER || 'false',
    PREFIX: process.env.PREFIX || '!',
    TIMEZONE: process.env.TIMEZONE || 'Africa/Nairobi',
    MODE: process.env.MODE || 'group',
    WEATHERKEY: process.env.WEATHERKEY || 'x',
    PIXELKEY: process.env.PIXELKEY || 'x',
    NINJAKEY: process.env.NINJAKEY || 'x',
    BLOOM: JSON.stringify(Bot),
    MAXSTOREMESSAGES: process.env.MAXSTOREMESSAGES || '20',
    STOREWRITEINTERVAL: process.env.STOREWRITEINTERVAL || '10000',
    CPYEAR: new Date().getFullYear().toString()
  };

  const Setting = await connectDB();
  for (const [key, value] of Object.entries(defaults)) {
    const exists = await Setting.exists({ _id: key });
    if (!exists) {
      await Setting.create({ _id: key, value: String(value ?? '') });
      console.log(`[MongoDB] Inserted default key: ${key}`);
    }
  }
}

// ----- Get a config value -----
async function get(key) {
  const Setting = await connectDB();
  const doc = await Setting.findById(key).lean();
  if (doc && doc.value != null) return String(doc.value);
  return process.env[key] ? String(process.env[key]) : '';
}

// ----- Set or update a config value -----
async function set(key, value) {
  if (value === undefined || value === null) {
    throw new Error(`[Setup] Cannot set key "${key}" to undefined or null`);
  }
  const Setting = await connectDB();
  await Setting.findByIdAndUpdate(
    key,
    { value: String(value) },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return String(value);
}

// ----- Initialize defaults immediately -----
initDefaults().catch(err => console.error('[MongoDB] initDefaults failed:', err));

module.exports = {
  connectDB,
  initDefaults,
  get,
  set
};