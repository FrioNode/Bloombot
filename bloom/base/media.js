const fs = require('fs');
const path = require('path');
const yts = require('yt-search');
const YtDlpWrap = require('yt-dlp-wrap').default;

const ytDlpWrap = new YtDlpWrap();

// Helper function to format duration
function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 3600 % 60);
    return [h, m > 9 ? m : h ? '0' + m : m || '0', s > 9 ? s : '0' + s]
    .filter(Boolean)
    .join(':');
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
                // Send processing message
                const processingMsg = await Bloom.sendMessage(message.key.remoteJid, {
                    text: '🔍 Searching YouTube...'
                }, { quoted: message });

                const search = await yts(query);
                const videos = search.videos.slice(0, 5);

                if (!videos.length) {
                    await Bloom.sendMessage(message.key.remoteJid, { text: '❌ No videos found' });
                    return;
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
            if (!url || !url.startsWith('http')) {
                return await Bloom.sendMessage(message.key.remoteJid, {
                    text: '❌ Invalid YouTube URL\n\nExample: !ytmp3 https://youtu.be/dQw4w9WgXcQ'
                }, { quoted: message });
            }

            const tempFile = path.join(__dirname, `../../temp/${Date.now()}.mp3`);
            fs.mkdirSync(path.dirname(tempFile), { recursive: true });

            try {
                // Send processing message
                const processingMsg = await Bloom.sendMessage(message.key.remoteJid, {
                    text: '⏳ Downloading audio... This may take a moment.'
                }, { quoted: message });

                let videoInfo;
                await new Promise((resolve, reject) => {
                    // First get video info for metadata
                    ytDlpWrap.exec([
                        url,
                        '--dump-json',
                        '--no-warnings'
                    ])
                    .on('error', reject)
                    .on('ytDlpEvent', (eventType, eventData) => {
                        if (eventType === 'download') {
                            try {
                                videoInfo = JSON.parse(eventData.toString());
                            } catch {}
                        }
                    })
                    .on('close', () => {
                        // Then download the actual audio
                        ytDlpWrap.exec([
                            url,
                            '--extract-audio',
                            '--audio-format', 'mp3',
                            '--output', tempFile,
                            '--no-check-certificates',
                            '--no-warnings',
                            '--prefer-free-formats'
                        ])
                        .on('error', reject)
                        .on('close', resolve);
                    });
                });

                const caption = videoInfo ?
                `🎵 *${videoInfo.title}*\n` +
                `👤 *Author:* ${videoInfo.uploader}\n` +
                `⏱ *Duration:* ${formatDuration(videoInfo.duration)}\n` +
                (videoInfo.upload_date ? `📅 *Uploaded:* ${videoInfo.upload_date.substring(0, 4)}\n` : '') +
                (videoInfo.like_count ? `👍 *Likes:* ${videoInfo.like_count.toLocaleString()}\n` : '') +
                (videoInfo.view_count ? `👀 *Views:* ${videoInfo.view_count.toLocaleString()}` : '')
                : 'Downloaded Audio';

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
            if (!url || !url.startsWith('http')) {
                return await Bloom.sendMessage(message.key.remoteJid, {
                    text: '❌ Invalid YouTube URL\n\nExample: !ytmp4 https://youtu.be/dQw4w9WgXcQ'
                }, { quoted: message });
            }

            const tempFile = path.join(__dirname, `../../temp/${Date.now()}.mp4`);
            fs.mkdirSync(path.dirname(tempFile), { recursive: true });

            try {
                // Send processing message
                const processingMsg = await Bloom.sendMessage(message.key.remoteJid, {
                    text: '⏳ Downloading video... This may take a moment.'
                }, { quoted: message });

                let videoInfo;
                await new Promise((resolve, reject) => {
                    // First get video info for metadata
                    ytDlpWrap.exec([
                        url,
                        '--dump-json',
                        '--no-warnings'
                    ])
                    .on('error', reject)
                    .on('ytDlpEvent', (eventType, eventData) => {
                        if (eventType === 'download') {
                            try {
                                videoInfo = JSON.parse(eventData.toString());
                            } catch {}
                        }
                    })
                    .on('close', () => {
                        // Then download the actual video
                        ytDlpWrap.exec([
                            url,
                            '--format', 'mp4',
                            '--output', tempFile,
                            '--no-check-certificates',
                            '--no-warnings',
                            '--prefer-free-formats'
                        ])
                        .on('error', reject)
                        .on('close', resolve);
                    });
                });

                const stats = fs.statSync(tempFile);
                if (stats.size > 50 * 1024 * 1024) { // 50MB limit
                    fs.unlinkSync(tempFile);
                    return await Bloom.sendMessage(message.key.remoteJid, {
                        text: '❌ File too large to send (limit is 50MB).'
                    }, { quoted: message });
                }

                const caption = videoInfo ?
                `🎬 *${videoInfo.title}*\n` +
                `👤 *Author:* ${videoInfo.uploader}\n` +
                `⏱ *Duration:* ${formatDuration(videoInfo.duration)}\n` +
                (videoInfo.upload_date ? `📅 *Uploaded:* ${videoInfo.upload_date.substring(0, 4)}\n` : '') +
                (videoInfo.like_count ? `👍 *Likes:* ${videoInfo.like_count.toLocaleString()}\n` : '') +
                (videoInfo.view_count ? `👀 *Views:* ${videoInfo.view_count.toLocaleString()}` : '')
                : 'Downloaded Video';

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
                    text: `❌ Failed to download video:\n${err.message}`
                }, { quoted: message });
            }
        }
    }
};