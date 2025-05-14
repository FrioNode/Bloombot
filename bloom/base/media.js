const fs = require('fs');
const path = require('path');
const ytdl = require('@distube/ytdl-core');
const yts = require('yt-search');
const { PassThrough } = require('stream');
// Helper function to format duration

function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, h ? String(m).padStart(2, '0') : m, String(s).padStart(2, '0')].filter(Boolean).join(':');
}


module.exports = {
    ytsearch: {
        type: 'user',
        desc: 'Search YouTube videos',
        usage: 'ytsearch <query>',
        run: async (Bloom, message, fulltext) => {
            const query = fulltext.split(' ').slice(1).join(' ');
            if (!query) return await Bloom.sendMessage(message.key.remoteJid, { text: '❌ Please provide a search query' });

            try {
                await Bloom.sendMessage(message.key.remoteJid, { text: '🔍 Searching YouTube...' }, { quoted: message });

                const search = await yts(query);
                const videos = search.videos.slice(0, 5);

                if (!videos.length) {
                    return await Bloom.sendMessage(message.key.remoteJid, { text: '❌ No videos found' });
                }

                let results = '🎬 YouTube Search Results:\n\n';
                videos.forEach((video, i) => {
                    results += `${i + 1}. ${video.title}\n`;
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
            const url = fulltext.split(' ')[1]?.trim();
            if (!url || !ytdl.validateURL(url)) {
                return await Bloom.sendMessage(message.key.remoteJid, {
                    text: '❌ Invalid YouTube URL\n\nExample: !ytmp3 https://youtu.be/dQw4w9WgXcQ'
                }, { quoted: message });
            }

            const tempFile = path.join(__dirname, `../../temp/${Date.now()}.mp3`);
            fs.mkdirSync(path.dirname(tempFile), { recursive: true });

            try {
                await Bloom.sendMessage(message.key.remoteJid, {
                    text: '⏳ Downloading audio... This may take a moment.'
                }, { quoted: message });

                const info = await ytdl.getInfo(url);
                const audioStream = ytdl(url, {
                    filter: 'audioonly',
                    quality: 'highestaudio',
                });

                await new Promise((resolve, reject) => {
                    const file = fs.createWriteStream(tempFile);
                    audioStream.pipe(file);
                    audioStream.on('error', reject);
                    file.on('finish', resolve);
                    file.on('error', reject);
                });

                const caption =
                `🎵 *${info.videoDetails.title}*\n` +
                `👤 *Author:* ${info.videoDetails.author.name}\n` +
                `⏱ *Duration:* ${formatDuration(parseInt(info.videoDetails.lengthSeconds))}\n` +
                `👀 *Views:* ${Number(info.videoDetails.viewCount).toLocaleString()}`;

                await Bloom.sendMessage(message.key.remoteJid, {
                    audio: { url: tempFile },
                    mimetype: 'audio/mpeg',
                    fileName: `audio.mp3`,
                    ptt: false
                }, {
                    quoted: message,
                    caption: caption
                });

                fs.unlink(tempFile, () => {});
            } catch (err) {
                console.error('YTMP3 Error:', err);
                await Bloom.sendMessage(message.key.remoteJid, {
                    text: `❌ Failed to download audio:\n${err.message}`
                }, { quoted: message });
            }
        }
    },



        ytmp4: {
            type: 'user',
            desc: 'Stream YouTube video (max 10 min, 50MB)',
            usage: 'ytmp4 <url>',
            run: async (Bloom, message, fulltext) => {
                const url = fulltext.split(' ')[1]?.trim();
                const jid = message.key.remoteJid;

                if (!url || !ytdl.validateURL(url)) {
                    return await Bloom.sendMessage(jid, { text: '❌ Invalid YouTube URL' }, { quoted: message });
                }

                try {
                    const info = await ytdl.getInfo(url);
                    const duration = parseInt(info.videoDetails.lengthSeconds);

                    if (duration > 600) {
                        return await Bloom.sendMessage(jid, { text: '❌ Video too long. Max 10 minutes allowed.' }, { quoted: message });
                    }

                    await Bloom.sendMessage(jid, { text: '⏳ Fetching and streaming video (max 50MB)...' }, { quoted: message });

                    let downloaded = 0;
                    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
                    const stream = new PassThrough();

                    const video = ytdl(url, { quality: '18' });
                    video.on('data', chunk => {
                        downloaded += chunk.length;
                        if (downloaded > MAX_SIZE) {
                            video.destroy();
                            stream.end();
                        } else {
                            stream.write(chunk);
                        }
                    });

                    video.on('end', () => stream.end());
                    video.on('error', err => {
                        console.error('Stream error:', err);
                        Bloom.sendMessage(jid, { text: '❌ Error while streaming video.' }, { quoted: message });
                    });

                    const caption =
                    `🎬 *${info.videoDetails.title}*\n` +
                    `👤 *Author:* ${info.videoDetails.author.name}\n` +
                    `⏱ *Duration:* ${formatDuration(duration)}\n` +
                    `👀 *Views:* ${Number(info.videoDetails.viewCount).toLocaleString()}`;

                    await Bloom.sendMessage(jid, {
                        video: stream,
                        mimetype: 'video/mp4',
                        fileName: 'video.mp4',
                        caption: caption
                    }, { quoted: message });

                } catch (err) {
                    console.error('ytmp4 error:', err);
                    await Bloom.sendMessage(jid, { text: `❌ Failed to process video: ${err.message}` }, { quoted: message });
                }
            }
        }
};