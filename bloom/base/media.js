const yts = require("yt-search");
const ytdl = require("ytdl-core");
const fs = require('fs');
const path = require('path');
const { proto } = require('@whiskeysockets/baileys');

module.exports = {
    ytsearch: {
        type: 'user',
        desc: 'Search YouTube videos',
        usage: 'ytsearch <query>',
        run: async (Bloom, message, fulltext) => {
            const query = fulltext.split(' ').slice(1).join(' ');
            if (!query) return await Bloom.sendMessage(message.key.remoteJid, { text: '❌ Please provide a search query' });

            try {
                const search = await yts(query);
                const videos = search.videos.slice(0, 5); // Get top 5 results

                if (!videos.length) {
                    return await Bloom.sendMessage(message.key.remoteJid, { text: '❌ No videos found' });
                }

                let results = '🎬 YouTube Search Results:\n\n';
                videos.forEach((video, i) => {
                    results += `${i+1}. ${video.title}\n`;
                    results += `⏱️ ${video.timestamp} | 👀 ${video.views}\n`;
                    results += `🔗 ${video.url}\n\n`;
                });

                await Bloom.sendMessage(message.key.remoteJid, { text: results });
            } catch (err) {
                console.error('YT Search Error:', err);
                await Bloom.sendMessage(message.key.remoteJid, { text: '❌ Error searching YouTube' });
            }
        }
    },
    ytmp3: {
        type: 'user',
        desc: 'Download YouTube audio',
        usage: 'ytmp3 <url>',
        run: async (Bloom, message, fulltext) => {
            const url = fulltext.split(' ')[1];
            if (!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
                return await Bloom.sendMessage(message.key.remoteJid, { text: '❌ Invalid YouTube URL' });
            }

            try {
                const info = await ytdl.getInfo(url);
                const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
                const filename = path.join(__dirname, `../../temp/${Date.now()}.mp3`);

                ytdl(url, { filter: 'audioonly', quality: 'highestaudio' })
                    .pipe(fs.createWriteStream(filename))
                    .on('finish', async () => {
                        await Bloom.sendMessage(message.key.remoteJid, {
                            audio: fs.readFileSync(filename),
                            mimetype: 'audio/mp4',
                            fileName: `${title}.mp3`
                        }, { quoted: message });
                        fs.unlinkSync(filename);
                    });
            } catch (err) {
                console.error('YTMP3 Error:', err);
                await Bloom.sendMessage(message.key.remoteJid, { text: '❌ Error downloading audio' });
            }
        }
    },
    ytmp4: {
        type: 'user',
        desc: 'Download YouTube video',
        usage: 'ytmp4 <url>',
        run: async (Bloom, message, fulltext) => {
            const url = fulltext.split(' ')[1];
            if (!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
                return await Bloom.sendMessage(message.key.remoteJid, { text: '❌ Invalid YouTube URL' });
            }

            try {
                const info = await ytdl.getInfo(url);
                const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
                const filename = path.join(__dirname, `../../temp/${Date.now()}.mp4`);

                ytdl(url, { quality: 'highest' })
                    .pipe(fs.createWriteStream(filename))
                    .on('finish', async () => {
                        await Bloom.sendMessage(message.key.remoteJid, {
                            video: fs.readFileSync(filename),
                            caption: title,
                            fileName: `${title}.mp4`
                        }, { quoted: message });
                        fs.unlinkSync(filename);
                    });
            } catch (err) {
                console.error('YTMP4 Error:', err);
                await Bloom.sendMessage(message.key.remoteJid, { text: '❌ Error downloading video' });
            }
        }
    }
};