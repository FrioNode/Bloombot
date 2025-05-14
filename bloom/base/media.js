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
            desc: 'Download YouTube video',
            usage: 'ytmp4 <url>',
            run: async (Bloom, message, fulltext) => {
                const url = fulltext.split(' ')[1]?.trim();
                if (!url || !ytdl.validateURL(url)) {
                    return await Bloom.sendMessage(message.key.remoteJid, {
                        text: '❌ Invalid YouTube URL\n\nExample: !ytmp4 https://youtu.be/dQw4w9WgXcQ'
                    }, { quoted: message });
                }

                const tempFile = path.join(__dirname, `../../temp/${Date.now()}.mp4`);
                fs.mkdirSync(path.dirname(tempFile), { recursive: true });

                try {
                    const info = await ytdl.getInfo(url);
                    const durationSeconds = parseInt(info.videoDetails.lengthSeconds || 0);

                    if (durationSeconds > 600) {
                        return await Bloom.sendMessage(message.key.remoteJid, {
                            text: '❌ Video is longer than 10 minutes. Cannot process.'
                        }, { quoted: message });
                    }

                    await Bloom.sendMessage(message.key.remoteJid, {
                        text: '⏳ Downloading video... This may take a moment.'
                    }, { quoted: message });

                    const videoStream = ytdl(url, { quality: '18' }); // mp4 360p

                    const fileStream = fs.createWriteStream(tempFile);
                    let totalSize = 0;
                    let limitExceeded = false;

                    videoStream.on('data', (chunk) => {
                        totalSize += chunk.length;
                        if (totalSize > 50 * 1024 * 1024) {
                            limitExceeded = true;
                            videoStream.destroy();
                            fileStream.destroy();
                            fs.unlink(tempFile, () => {});
                        }
                    });

                    videoStream.pipe(fileStream);

                    await new Promise((resolve, reject) => {
                        videoStream.on('end', resolve);
                        videoStream.on('error', reject);
                        fileStream.on('error', reject);
                    });

                    if (limitExceeded) {
                        return await Bloom.sendMessage(message.key.remoteJid, {
                            text: '❌ File too large to send (limit is 50MB).'
                        }, { quoted: message });
                    }

                    const caption =
                    `🎬 *${info.videoDetails.title}*\n` +
                    `👤 *Author:* ${info.videoDetails.author?.name || 'Unknown'}\n` +
                    `⏱ *Duration:* ${formatDuration(durationSeconds)}\n` +
                    `👀 *Views:* ${Number(info.videoDetails.viewCount || 0).toLocaleString()}`;

                    await Bloom.sendMessage(message.key.remoteJid, {
                        video: { url: tempFile },
                        caption: caption,
                        fileName: `video.mp4`,
                        gifPlayback: false
                    }, { quoted: message });

                    fs.unlink(tempFile, () => {});
                } catch (err) {
                    console.error('YTMP4 Error:', err);
                    await Bloom.sendMessage(message.key.remoteJid, {
                        text: `❌ Failed to process video:\n${err.message || err.toString()}`
                    }, { quoted: message });
                }
            }
        }
};