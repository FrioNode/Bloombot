const mongoose = require('mongoose');
const pokemonSchema = new mongoose.Schema({
    name: { type: String, required: true },
    weight: { type: Number, required: true },
    height: { type: Number, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true },
    timeout: { type: Date, required: true },
});

const Pokemon = mongoose.model('Pokemon', pokemonSchema);
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

const User = mongoose.model('User', userSchema);

module.exports = { Pokemon, User };