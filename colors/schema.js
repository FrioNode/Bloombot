const mongoose = require('mongoose');
const pokemonSchema = new mongoose.Schema({
    name: { type: String, required: true },
    weight: { type: Number, required: true },
    height: { type: Number, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true },
    timeout: { type: Date, required: true },
});

const userSchema = new mongoose.Schema({
    _id: { type: String },
    name: { type: String, required: true },
    walletBalance: { type: Number, default: 0 },
    bankBalance: { type: Number, default: 0 },
    inventory: {
        mining: [{
            name: { type: String, required: true },
            miningUses: { type: Number, default: 0 },
        }],
        magic: [{
            name: { type: String, required: true },
            miningUses: { type: Number, default: 0 },
        }],
        fishing: [{
            name: { type: String, required: true },
            miningUses: { type: Number, default: 0 },
        }],
        healing: [{
            name: { type: String, required: true },
            miningUses: { type: Number, default: 0 },
        }],
        animals: [{
            name: { type: String, required: true },
            value: { type: Number, required: true },
        }],
        stones: [{
            name: { type: String, required: true },
            value: { type: Number, required: true },
        }],
        pokemons: [{
            name: { type: String, required: true },
            height: { type: Number, required: true },
            weight: { type: Number, require: true },
            image: { type: String, required: true },
            description: { type: String, required: true },
        }],
    },
    transactionHistory: [{
        type: Object,
        arg: Number,
        item: String,
        result: String,
        transactionFee: { type: Number, default: 0 },
        animal: String,
        date: { type: Date, default: Date.now },
    }],
    lastDailyClaim: { type: Date, default: Date.now },
    lastZooCatch: { type: Date, default: Date.now },
    lastGamble: { type: Date, default: Date.now },
    lastWork: { type: Date, default: Date.now },
    lastFishCatch: { type: Date, default: Date.now },
});

const expSchema = new mongoose.Schema({
    jid: { type: String, required: true, unique: true },
    points: { type: Number, default: 0 },
    lastDaily: Date,
    streak: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
}, { timestamps: true });

const settingsSchema = new mongoose.Schema({
    group: { type: String, required: true, unique: true },
    antiLink: { type: Boolean, default: false },
    noImage: { type: Boolean, default: false },
    gameEnabled: { type: Boolean, default: true },
    nsfwEnabled: { type: Boolean, default: false },
    warns: { type: Map, of: Number, default: {} }
});


const userCounterSchema = new mongoose.Schema({
    user: { type: String, required: true, unique: true },
    count: { type: Number, default: 1 },
    lastUpdated: { type: Date, default: Date.now }
});

const afkSchema = new mongoose.Schema({
    user: { type: String, required: true, unique: true }, // WhatsApp JID
    reason: { type: String, default: '' },
    since: { type: Date, default: Date.now }
});

const AFK = mongoose.model('AFK', afkSchema);
const Pokemon = mongoose.model('Pokemon', pokemonSchema);
const UserCounter = mongoose.model('UserCounter', userCounterSchema);
const User = mongoose.model('User', userSchema);
const Settings = mongoose.model('Settings', settingsSchema);
const Exp = mongoose.model('Exp', expSchema);

module.exports = { Pokemon, UserCounter, User , Settings, Exp, AFK };