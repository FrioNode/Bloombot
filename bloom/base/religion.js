const fetch = require('node-fetch');

module.exports = {
    'bible': {
        type: 'religion',
        desc: 'Get Bible verses and chapters',
        usage: 'bible [book chapter:verse]',
        react: '✝️',
        run: async (Bloom, message, fulltext) => {
            const BASE_URL = "https://bible-api.com";
            const args = fulltext.trim().split(' ').slice(1).join(' ');
            
            if (!args) {
                return await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Example: bible John 3:16*\n*Or: bible Genesis 1*` 
                }, { quoted: message });
            }
            
            try {
                const chapterInput = encodeURIComponent(args);
                const chapterRes = await fetch(`${BASE_URL}/${chapterInput}`, {
                    timeout: 10000
                });
                
                if (!chapterRes.ok) {
                    return await Bloom.sendMessage(message.key.remoteJid, { 
                        text: `*Verse not found. Example: bible John 3:16*` 
                    }, { quoted: message });
                }
                
                const chapterData = await chapterRes.json();
                const bibleChapter = `
*The Holy Bible* 📖

*Reference:* ${chapterData.reference}
*Translation:* ${chapterData.translation_name}
*Verses:* ${chapterData.verses.length}

*Content:*
${chapterData.text}`;
                
                await Bloom.sendMessage(message.key.remoteJid, { 
                    text: bibleChapter 
                }, { quoted: message });
                
            } catch (error) {
                console.error("Error in bible command:", error);
                await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Error fetching Bible verse. Try: bible John 3:16*` 
                }, { quoted: message });
            }
        }
    },
    
    'quran': {
        type: 'religion',
        desc: 'Get Quran surah details',
        usage: 'quran [surah_number]',
        react: '🕋',
        run: async (Bloom, message, fulltext) => {
            const args = fulltext.trim().split(' ').slice(1);
            const surahNumber = args[0];
            
            if (!surahNumber || isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
                return await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Example: quran 1*\n*Enter surah number (1-114)*` 
                }, { quoted: message });
            }
            
            try {
                // Get surah details
                const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`, {
                    timeout: 10000
                });
                
                if (!res.ok) {
                    return await Bloom.sendMessage(message.key.remoteJid, { 
                        text: `*Error fetching surah ${surahNumber}*` 
                    }, { quoted: message });
                }
                
                const json = await res.json();
                
                if (!json.data || !json.data.ayahs) {
                    return await Bloom.sendMessage(message.key.remoteJid, { 
                        text: `*Surah ${surahNumber} data not found*` 
                    }, { quoted: message });
                }
                
                const surah = json.data;
                const ayahs = surah.ayahs.slice(0, 5); // First 5 verses
                
                let versesText = '';
                ayahs.forEach(ayah => {
                    versesText += `*${ayah.numberInSurah}.* ${ayah.text}\n\n`;
                });
                
                const quranText = `
*Quran - The Holy Book* 📖

*Surah ${surah.number}: ${surah.englishName}*
*(${surah.englishNameTranslation})*

*Arabic Name:* ${surah.name}
*Type:* ${surah.revelationType}
*Verses:* ${surah.numberOfAyahs}

*First 5 Verses:*
${versesText}
*Use: quranfull ${surahNumber} for more verses*`;
                
                await Bloom.sendMessage(message.key.remoteJid, { 
                    text: quranText 
                }, { quoted: message });
                
            } catch (error) {
                console.error("Error in quran command:", error);
                await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Error fetching Quran data. Try: quran 1*` 
                }, { quoted: message });
            }
        }
    },
    
    'quranaudio': {
        type: 'religion',
        desc: 'Get Quran audio recitation',
        usage: 'quranaudio [surah_number]',
        react: '🎵',
        run: async (Bloom, message, fulltext) => {
            const args = fulltext.trim().split(' ').slice(1);
            const surahNumber = args[0];
            
            if (!surahNumber || isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
                return await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Example: quranaudio 1*\n*Enter surah number (1-114)*` 
                }, { quoted: message });
            }
            
            // Use reliable audio URLs that should work
            const audioUrls = {
                1: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
                2: 'https://everyayah.com/data/Alafasy_128kbps/002001.mp3',
                36: 'https://everyayah.com/data/Alafasy_128kbps/036001.mp3',
                55: 'https://everyayah.com/data/Alafasy_128kbps/055001.mp3',
                67: 'https://everyayah.com/data/Alafasy_128kbps/067001.mp3',
                112: 'https://everyayah.com/data/Alafasy_128kbps/112001.mp3',
                113: 'https://everyayah.com/data/Alafasy_128kbps/113001.mp3',
                114: 'https://everyayah.com/data/Alafasy_128kbps/114001.mp3'
            };
            
            const audioUrl = audioUrls[surahNumber];
            
            if (!audioUrl) {
                return await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Audio for Surah ${surahNumber} is not available.*\n*Available surahs: 1, 2, 36, 55, 67, 112, 113, 114*` 
                }, { quoted: message });
            }
            
            try {
                // Send audio directly without checking first
                await Bloom.sendMessage(message.key.remoteJid, {
                    audio: { url: audioUrl },
                    mimetype: 'audio/mpeg',
                    fileName: `Surah_${surahNumber}.mp3`,
                    ptt: false
                }, { quoted: message });
                
            } catch (error) {
                console.error("Error in quranaudio command:", error);
                await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Failed to send audio for Surah ${surahNumber}.*\n*Try a different surah.*` 
                }, { quoted: message });
            }
        }
    },
    
    'quransurah': {
        type: 'religion',
        desc: 'Search Quran by surah name',
        usage: 'quransurah [surah_name]',
        react: '📖',
        run: async (Bloom, message, fulltext) => {
            const surahName = fulltext.trim().split(' ').slice(1).join(' ');
            
            if (!surahName) {
                return await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Example: quransurah Al-Fatiha*\n*Or: quransurah Ya-Sin*` 
                }, { quoted: message });
            }
            
            try {
                const res = await fetch('https://api.alquran.cloud/v1/surah', {
                    timeout: 10000
                });
                
                if (!res.ok) {
                    return await Bloom.sendMessage(message.key.remoteJid, { 
                        text: `*Error fetching surah list*` 
                    }, { quoted: message });
                }
                
                const json = await res.json();
                
                if (!json.data) {
                    return await Bloom.sendMessage(message.key.remoteJid, { 
                        text: `*No surah data found*` 
                    }, { quoted: message });
                }
                
                // Search for surah
                const surah = json.data.find(s => 
                    s.englishName.toLowerCase().includes(surahName.toLowerCase()) ||
                    s.name.toLowerCase().includes(surahName.toLowerCase()) ||
                    s.englishNameTranslation.toLowerCase().includes(surahName.toLowerCase())
                );
                
                if (!surah) {
                    return await Bloom.sendMessage(message.key.remoteJid, { 
                        text: `*Surah "${surahName}" not found. Try English or Arabic name.*` 
                    }, { quoted: message });
                }
                
                const surahInfo = `
*Surah Found:* 📖

*Number:* ${surah.number}
*Arabic:* ${surah.name}
*English:* ${surah.englishName}
*Meaning:* ${surah.englishNameTranslation}
*Type:* ${surah.revelationType}
*Verses:* ${surah.numberOfAyahs}

*Use:* quran ${surah.number} *to get verses*`;
                
                await Bloom.sendMessage(message.key.remoteJid, { 
                    text: surahInfo 
                }, { quoted: message });
                
            } catch (error) {
                console.error("Error in quransurah command:", error);
                await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Error searching surah. Try again later.*` 
                }, { quoted: message });
            }
        }
    },
    
    'quranfull': {
        type: 'religion',
        desc: 'Get full surah with all verses',
        usage: 'quranfull [surah_number]',
        react: '📚',
        run: async (Bloom, message, fulltext) => {
            const args = fulltext.trim().split(' ').slice(1);
            const surahNumber = args[0];
            
            if (!surahNumber || isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
                return await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Example: quranfull 1*\n*Enter surah number (1-114)*` 
                }, { quoted: message });
            }
            
            try {
                const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`, {
                    timeout: 15000
                });
                
                if (!res.ok) {
                    return await Bloom.sendMessage(message.key.remoteJid, { 
                        text: `*Error fetching surah ${surahNumber}*` 
                    }, { quoted: message });
                }
                
                const json = await res.json();
                
                if (!json.data || !json.data.ayahs) {
                    return await Bloom.sendMessage(message.key.remoteJid, { 
                        text: `*Surah ${surahNumber} data not found*` 
                    }, { quoted: message });
                }
                
                const surah = json.data;
                
                // For long surahs, split into multiple messages
                const maxVersesPerMessage = 10;
                const totalVerses = surah.ayahs.length;
                
                for (let i = 0; i < totalVerses; i += maxVersesPerMessage) {
                    const chunk = surah.ayahs.slice(i, i + maxVersesPerMessage);
                    
                    let versesText = '';
                    chunk.forEach(ayah => {
                        versesText += `*${ayah.numberInSurah}.* ${ayah.text}\n\n`;
                    });
                    
                    const messageText = i === 0 ? 
                        `*Quran - Surah ${surah.number}: ${surah.englishName}*\n` +
                        `*Verses ${i + 1}-${Math.min(i + maxVersesPerMessage, totalVerses)} of ${totalVerses}*\n\n` +
                        versesText :
                        `*[Continued] Verses ${i + 1}-${Math.min(i + maxVersesPerMessage, totalVerses)}*\n\n` +
                        versesText;
                    
                    await Bloom.sendMessage(message.key.remoteJid, { 
                        text: messageText 
                    }, i === 0 ? { quoted: message } : {});
                    
                    // Delay between messages to avoid rate limiting
                    if (i + maxVersesPerMessage < totalVerses) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
                
            } catch (error) {
                console.error("Error in quranfull command:", error);
                await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Error fetching full surah. Try a shorter surah.*` 
                }, { quoted: message });
            }
        }
    },
    
    'quranlist': {
        type: 'religion',
        desc: 'List all Quran surahs',
        usage: 'quranlist',
        react: '📋',
        run: async (Bloom, message, fulltext) => {
            try {
                const res = await fetch('https://api.alquran.cloud/v1/surah', {
                    timeout: 10000
                });
                
                if (!res.ok) {
                    return await Bloom.sendMessage(message.key.remoteJid, { 
                        text: `*Error fetching surah list*` 
                    }, { quoted: message });
                }
                
                const json = await res.json();
                
                if (!json.data) {
                    return await Bloom.sendMessage(message.key.remoteJid, { 
                        text: `*No surah data found*` 
                    }, { quoted: message });
                }
                
                // Create categorized list
                let makki = '';
                let madani = '';
                
                json.data.forEach(surah => {
                    const line = `*${surah.number}.* ${surah.englishName} (${surah.name}) - ${surah.numberOfAyahs} verses\n`;
                    
                    if (surah.revelationType === 'Meccan') {
                        makki += line;
                    } else {
                        madani += line;
                    }
                });
                
                const surahList = `
*Quran Surahs List* 📖

*Meccan Surahs (Revealed in Mecca):*
${makki.substring(0, 1500)}${makki.length > 1500 ? '...\n' : ''}

*Medinan Surahs (Revealed in Medina):*
${madani.substring(0, 1500)}${madani.length > 1500 ? '...\n' : ''}

*Total: 114 Surahs*
*Use: quran [number] to get details*`;
                
                await Bloom.sendMessage(message.key.remoteJid, { 
                    text: surahList 
                }, { quoted: message });
                
            } catch (error) {
                console.error("Error in quranlist command:", error);
                await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Error fetching surah list. Try again later.*` 
                }, { quoted: message });
            }
        }
    },
    
    'quranverse': {
        type: 'religion',
        desc: 'Get specific Quran verse',
        usage: 'quranverse [surah:verse]',
        react: '🕋',
        run: async (Bloom, message, fulltext) => {
            const args = fulltext.trim().split(' ').slice(1).join(' ');
            
            if (!args || !args.includes(':')) {
                return await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Example: quranverse 1:1*\n*Or: quranverse 2:255*` 
                }, { quoted: message });
            }
            
            try {
                const [surah, verse] = args.split(':');
                
                if (!surah || !verse || isNaN(surah) || isNaN(verse) || surah < 1 || surah > 114) {
                    return await Bloom.sendMessage(message.key.remoteJid, { 
                        text: `*Invalid format. Example: quranverse 1:1*` 
                    }, { quoted: message });
                }
                
                const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${verse}`, {
                    timeout: 10000
                });
                
                if (!res.ok) {
                    return await Bloom.sendMessage(message.key.remoteJid, { 
                        text: `*Verse ${surah}:${verse} not found*` 
                    }, { quoted: message });
                }
                
                const json = await res.json();
                
                if (!json.data) {
                    return await Bloom.sendMessage(message.key.remoteJid, { 
                        text: `*Verse data not found*` 
                    }, { quoted: message });
                }
                
                const verseData = json.data;
                const verseText = `
*Quran Verse* 📖

*Surah ${verseData.surah.number}:${verseData.numberInSurah}*
*${verseData.surah.englishName} (${verseData.surah.englishNameTranslation})*

*Arabic:*
${verseData.text}

*Translation:*
${verseData.translation}

*Sajda:* ${verseData.sajda ? 'Yes' : 'No'}`;
                
                await Bloom.sendMessage(message.key.remoteJid, { 
                    text: verseText 
                }, { quoted: message });
                
            } catch (error) {
                console.error("Error in quranverse command:", error);
                await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Error fetching verse. Try: quranverse 1:1*` 
                }, { quoted: message });
            }
        }
    }
};