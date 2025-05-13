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


/*

const play = require('play-dl');
const fs = require('fs');
const path = require('path');

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
                await Bloom.sendMessage(message.key.remoteJid, {
                    text: '🔍 Searching YouTube... x'
                }, { quoted: message });

                const searchResults = await play.search(query, { limit: 5, source: { youtube: "video" } });

                if (!searchResults.length) {
                    await Bloom.sendMessage(message.key.remoteJid, { text: '❌ No videos found' });
                    return;
                }

                let results = '🎬 YouTube Search Results: x\n\n';
                searchResults.forEach((video, i) => {
                    results += `${i + 1}. ${video.title}\n`;
                    results += `⏱️ ${formatDuration(video.durationInSec)} | 👀 ${video.views.toLocaleString()}\n`;
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
            if (!url || !play.yt_validate(url)) {
                return await Bloom.sendMessage(message.key.remoteJid, {
                    text: '❌ Invalid YouTube URL\n\nExample: !ytmp3 https://youtu.be/dQw4w9WgXcQ'
                }, { quoted: message });
            }

            const tempFile = path.join(__dirname, `../../temp/${Date.now()}.mp3`);
            fs.mkdirSync(path.dirname(tempFile), { recursive: true });

            try {
                // Send processing message
                await Bloom.sendMessage(message.key.remoteJid, {
                    text: '⏳ Downloading audio... This may take a moment.'
                }, { quoted: message });

                // Get video info
                const videoInfo = await play.video_basic_info(url);
                const videoDetails = videoInfo.video_details;

                // Get audio stream - using quality: 0 for highest audio quality
                const stream = await play.stream_from_info(videoInfo, {
                    quality: 0,  // 0 = highest quality audio
                    discordPlayerCompatibility: false
                });

                // Write stream to file
                const writeStream = fs.createWriteStream(tempFile);
                stream.stream.pipe(writeStream);

                await new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                });

                const caption =
                `🎵 *${videoDetails.title}*\n` +
                `👤 *Author:* ${videoDetails.channel.name}\n` +
                `⏱ *Duration:* ${formatDuration(videoDetails.durationInSec)}\n` +
                `👀 *Views:* ${videoDetails.views.toLocaleString()}`;

                await Bloom.sendMessage(message.key.remoteJid, {
                    audio: { url: tempFile },
                    mimetype: 'audio/mpeg',
                    fileName: `${videoDetails.title}.mp3`.replace(/[^\w\s.-]/gi, ''),
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
            if (!url || !play.yt_validate(url)) {
                return await Bloom.sendMessage(message.key.remoteJid, {
                    text: '❌ Invalid YouTube URL\n\nExample: !ytmp4 https://youtu.be/dQw4w9WgXcQ'
                }, { quoted: message });
            }

            const tempFile = path.join(__dirname, `../../temp/${Date.now()}.mp4`);
            fs.mkdirSync(path.dirname(tempFile), { recursive: true });

            try {
                // Send processing message
                await Bloom.sendMessage(message.key.remoteJid, {
                    text: '⏳ Downloading video... This may take a moment. x'
                }, { quoted: message });

                // Get video info
                const videoInfo = await play.video_basic_info(url);
                const videoDetails = videoInfo.video_details;

                // Get video stream
                const stream = await play.stream_from_info(videoInfo, { quality: '360p' }); // Lower quality to reduce size

                // Write stream to file
                const writeStream = fs.createWriteStream(tempFile);
                stream.stream.pipe(writeStream);

                await new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                });

                const stats = fs.statSync(tempFile);
                if (stats.size > 50 * 1024 * 1024) { // 50MB limit
                    fs.unlinkSync(tempFile);
                    return await Bloom.sendMessage(message.key.remoteJid, {
                        text: '❌ File too large to send (limit is 50MB). Try !ytmp3 for audio instead.'
                    }, { quoted: message });
                }

                const caption =
                `🎬 *${videoDetails.title}*\n` +
                `👤 *Author:* ${videoDetails.channel.name}\n` +
                `⏱ *Duration:* ${formatDuration(videoDetails.durationInSec)}\n` +
                `👀 *Views:* ${videoDetails.views.toLocaleString()}`;

                await Bloom.sendMessage(message.key.remoteJid, {
                    video: { url: tempFile },
                    caption: caption,
                    fileName: `${videoDetails.title}.mp4`.replace(/[^\w\s.-]/gi, ''),
                                        gifPlayback: false
                }, { quoted: message });

                fs.unlink(tempFile, () => {});
            } catch (err) {
                console.error('YTMP4 Error:', err);
                await Bloom.sendMessage(message.key.remoteJid, {
                    text: `❌ Failed to download video: x\n${err.message}`
                }, { quoted: message });
            }
        }
    }
}; */