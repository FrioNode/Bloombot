const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { bloom,sudoChat, reboot } = require('../../colors/setup');
const mess = require('../../colors/mess');
require('dotenv').config({ path: path.join(__dirname, '../../config.env') });

module.exports = {
    set: {
        type: 'owner',
        desc: 'Set config variables in .env file (Owner only)',
        usage: 'set <KEY> <VALUE>',
        async run(Bloom, message, fulltext ) {
            const sender=message.key.participant || message.key.remoteJid;
            const arg = fulltext.split(' ').slice(1)[0];
            const value = fulltext.split(' ').slice(1).join(' ');
            if ( sender !== sudoChat) {
                return await Bloom.sendMessage(message.key.remoteJid, {
                    text: mess.owner
                }, { quoted: message });
            }

            if (!arg || !value) {
                return await Bloom.sendMessage(sender, {
                    text: 'Usage: set <arg> <value>'
                }, { quoted: message });
            }

            const envFilePath = path.join(__dirname, '../../config.env');

            try {
                let envContent = fs.readFileSync(envFilePath, 'utf8');
                const lines = envContent.split('\n');
                let updated = false;

                const newLine = `${arg.toUpperCase()}=${value}`;

                const updatedLines = lines.map(line => {
                    if (line.startsWith(`${arg.toUpperCase()}=`)) {
                        updated = true;
                        return newLine;
                    }
                    return line;
                });

                if (!updated) {
                    updatedLines.push(newLine);
                }

                fs.writeFileSync(envFilePath, updatedLines.join('\n'));

                require('dotenv').config({ path: envFilePath, override: true });

                const rebootRequired = reboot === 'true';
                await Bloom.sendMessage(message.key.remoteJid, { text: `Check DM for results..`},
                                        {quoted: message });
                await Bloom.sendMessage(sender, {
                    text: `⚙️ ${arg.toUpperCase()} updated to: ${value}\n\n` +
                        (rebootRequired ? mess.autorestart : mess.manualrestart)
                }, { quoted: message });

                if (rebootRequired && bloom.scripts?.restart) {
                    exec(bloom.scripts.restart, (error) => {
                        if (error) console.error('Restart failed:', error);
                    });
                }

            } catch (error) {
                console.error('Config update failed:', error);
                await Bloom.sendMessage(message.key.remoteJid, {
                    text: `❌ Failed to update config: ${error.message}`
                }, { quoted: message });
            }
        }
    }
};
