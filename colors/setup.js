const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env only in local/dev environments
if (process.env.NODE_ENV !== 'production') {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        console.log('[ENV] Loaded .env from', envPath);
    } else {
        console.warn('[ENV] .env not found at', envPath);
    }
}

const Bot = require('../package.json');
const configPath = path.join(__dirname, 'config.json');

// Cache the config to avoid frequent file reads
let cachedConfig = null;
let lastModified = 0;

function getConfig() {
    try {
        const stats = fs.statSync(configPath);
        if (!cachedConfig || stats.mtimeMs > lastModified) {
            lastModified = stats.mtimeMs;
            cachedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        return cachedConfig;
    } catch (error) {
        console.error('Error reading config:', error);
        return cachedConfig || {};
    }
}

function getAll() {
    const config = getConfig();
    return {
        ...config,
        session: process.env.SESSION,
        mongo: process.env.MONGO,
        sudochat: `${process.env.OWNERNUMBER || config.ownernumber}@s.whatsapp.net`,
        bloom: Bot,
        cpyear: new Date().getFullYear()
    };
}

// Get the initial config
const config = getAll();

// Export all properties directly at the root level
module.exports = {
    ...config,
    // Keep utility methods available
    _getConfig: getConfig,
    _getAll: getAll,
    _reload: () => {
        cachedConfig = null;
        return getAll();
    }
};