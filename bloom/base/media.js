const fs = require('fs');
const path = require('path');
const yts = require('yt-search');
const  YtDlpWrap = require('yt-dlp-wrap').default;

const ytDlpWrap = new YtDlpWrap();

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
            if (!url || !url.startsWith('http')) {
                return await Bloom.sendMessage(message.key.remoteJid, {
                    text: '❌ Invalid YouTube URL\n\nExample: !ytmp3 https://youtu.be/dQw4w9WgXcQ'
                }, { quoted: message });
            }

            const tempFile = path.join(__dirname, `../../temp/${Date.now()}.mp3`);
            fs.mkdirSync(path.dirname(tempFile), { recursive: true });

            try {
                await new Promise((resolve, reject) => {
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

                await Bloom.sendMessage(message.key.remoteJid, {
                    audio: { url: tempFile },
                    mimetype: 'audio/mpeg',
                    fileName: `audio.mp3`,
                    ptt: false
                }, { quoted: message });

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
                await new Promise((resolve, reject) => {
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

                const stats = fs.statSync(tempFile);
                if (stats.size > 50 * 1024 * 1024) { // 50MB limit
                    fs.unlinkSync(tempFile);
                    return await Bloom.sendMessage(message.key.remoteJid, {
                        text: '❌ File too large to send (limit is 50MB).'
                    }, { quoted: message });
                }

                await Bloom.sendMessage(message.key.remoteJid, {
                    video: { url: tempFile },
                    caption: `Downloaded Video`,
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
