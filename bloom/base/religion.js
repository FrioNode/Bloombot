const fetch = require('node-fetch');

module.exports = {
    bible: {
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
    
    quran: {
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
    
    qaudio: {
        type: 'religion',
        desc: 'Get Quran audio recitation',
        usage: 'qaudio [surah_number:verse] or [surah_number]',
        react: '🎵',
        run: async (Bloom, message, fulltext) => {
            const args = fulltext.trim().split(' ').slice(1).join(' ');
            
            if (!args) {
                return await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Example: quranaudio 1*\n*Or: quranaudio 2:255*\n*Surah numbers: 1-114*` 
                }, { quoted: message });
            }
            
            try {
                let surahNumber, verseNumber;
                
                // Check if input is in format "surah:verse"
                if (args.includes(':')) {
                    [surahNumber, verseNumber] = args.split(':').map(Number);
                } else {
                    surahNumber = parseInt(args);
                    verseNumber = 1; // Default to first verse
                }
                
                // Validate input
                if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
                    return await Bloom.sendMessage(message.key.remoteJid, { 
                        text: `*Invalid surah number. Must be 1-114*` 
                    }, { quoted: message });
                }
                
                // Pad numbers to 3 digits for surah and verse
                const paddedSurah = surahNumber.toString().padStart(3, '0');
                const paddedVerse = verseNumber.toString().padStart(3, '0');
                
                // Construct the audio URL
                const audioUrl = `https://everyayah.com/data/Alafasy_128kbps/${paddedSurah}${paddedVerse}.mp3`;
                
                // For surah 1-9, also try without the leading 0 in surah number
                const alternativeUrl = surahNumber < 10 ? 
                    `https://everyayah.com/data/Alafasy_128kbps/00${surahNumber}${paddedVerse}.mp3` : null;
                
                try {
                    // Try the first URL
                    await Bloom.sendMessage(message.key.remoteJid, {
                        audio: { url: audioUrl },
                        mimetype: 'audio/mpeg',
                        fileName: `Surah_${surahNumber}_Verse_${verseNumber}.mp3`,
                        ptt: false
                    }, { quoted: message });
                    
                } catch (error1) {
                    // If first fails and alternative exists, try it
                    if (alternativeUrl) {
                        try {
                            await Bloom.sendMessage(message.key.remoteJid, {
                                audio: { url: alternativeUrl },
                                mimetype: 'audio/mpeg',
                                fileName: `Surah_${surahNumber}_Verse_${verseNumber}.mp3`,
                                ptt: false
                            }, { quoted: message });
                        } catch (error2) {
                            throw new Error(`Audio not found for Surah ${surahNumber}:${verseNumber}`);
                        }
                    } else {
                        throw error1;
                    }
                }
                
            } catch (error) {
                console.error("Error in quranaudio command:", error);
                await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Error: ${error.message || 'Audio not available'}*\n*Try: quranaudio 1:1 or quranaudio 36*` 
                }, { quoted: message });
            }
        }
    },
    
    qfaudio: {
        type: 'religion',
        desc: 'Get complete surah audio recitation',
        usage: 'qfaudio [surah_number]',
        react: '📻',
        run: async (Bloom, message, fulltext) => {
            const args = fulltext.trim().split(' ').slice(1);
            const surahNumber = args[0];
            
            if (!surahNumber || isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
                return await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Example: quranfullaudio 1*\n*Enter surah number (1-114)*` 
                }, { quoted: message });
            }
            
            try {
                // For full surah, use verse 000 which usually contains the full surah
                const paddedSurah = surahNumber.toString().padStart(3, '0');
                const audioUrl = `https://everyayah.com/data/Alafasy_128kbps/${paddedSurah}000.mp3`;
                
                // Alternative format for some surahs
                const alternativeUrl = `https://everyayah.com/data/Alafasy_128kbps/00${surahNumber}000.mp3`;
                
                try {
                    await Bloom.sendMessage(message.key.remoteJid, {
                        audio: { url: audioUrl },
                        mimetype: 'audio/mpeg',
                        fileName: `Surah_${surahNumber}_Complete.mp3`,
                        ptt: false
                    }, { quoted: message });
                    
                } catch (error1) {
                    try {
                        await Bloom.sendMessage(message.key.remoteJid, {
                            audio: { url: alternativeUrl },
                            mimetype: 'audio/mpeg',
                            fileName: `Surah_${surahNumber}_Complete.mp3`,
                            ptt: false
                        }, { quoted: message });
                    } catch (error2) {
                        // If full surah not available, send first verse
                        const firstVerseUrl = `https://everyayah.com/data/Alafasy_128kbps/${paddedSurah}001.mp3`;
                        await Bloom.sendMessage(message.key.remoteJid, {
                            audio: { url: firstVerseUrl },
                            mimetype: 'audio/mpeg',
                            fileName: `Surah_${surahNumber}_Verse_1.mp3`,
                            ptt: false
                        }, { quoted: message });
                        
                        await Bloom.sendMessage(message.key.remoteJid, { 
                            text: `*Note: Full surah audio not available. Sent first verse instead.*\n*Use: quranaudio ${surahNumber}:X for specific verses*` 
                        }, { quoted: message });
                    }
                }
                
            } catch (error) {
                console.error("Error in quranfullaudio command:", error);
                await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Error fetching audio. Try: quranfullaudio 1*` 
                }, { quoted: message });
            }
        }
    },
    
    qsurah: {
        type: 'religion',
        desc: 'Search Quran by surah name',
        usage: 'qsurah [surah_name]',
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

*Use:* 
• qverse ${surah.number} *for verses*
• qaudio ${surah.number} *for audio*
• qfull ${surah.number} *for full text*`;
                
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
    
    quranlist: {
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
    
    qverse: {
        type: 'religion',
        desc: 'Get specific Quran verse',
        usage: 'qverse [surah:verse]',
        react: '🕋',
        run: async (Bloom, message, fulltext) => {
            const args = fulltext.trim().split(' ').slice(1).join(' ');
            
            if (!args || !args.includes(':')) {
                return await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Example: quranverse 1:1*\n*Or: quranverse 2:255*` 
                }, { quoted: message });
            }
            
            try {
                const [surah, verse] = args.split(':').map(Number);
                
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
    },
    
    qsearch: {
        type: 'religion',
        desc: 'Search Quran for specific words',
        usage: 'qsearch [keyword]',
        react: '🔍',
        run: async (Bloom, message, fulltext) => {
            const keyword = fulltext.trim().split(' ').slice(1).join(' ');
            
            if (!keyword) {
                return await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Example: quransearch mercy*\n*Or: quransearch الله*` 
                }, { quoted: message });
            }
            
            try {
                const res = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(keyword)}/all/en`, {
                    timeout: 15000
                });
                
                if (!res.ok) {
                    return await Bloom.sendMessage(message.key.remoteJid, { 
                        text: `*Error searching Quran*` 
                    }, { quoted: message });
                }
                
                const json = await res.json();
                
                if (!json.data || json.data.count === 0) {
                    return await Bloom.sendMessage(message.key.remoteJid, { 
                        text: `*No results found for "${keyword}"*` 
                    }, { quoted: message });
                }
                
                const matches = json.data.matches.slice(0, 10); // Limit to 10 results
                
                let searchResults = `*Quran Search Results* 🔍\n\n`;
                searchResults += `*Keyword:* ${keyword}\n`;
                searchResults += `*Total matches:* ${json.data.count}\n\n`;
                
                matches.forEach((match, index) => {
                    searchResults += `*${index + 1}. ${match.surah.name} ${match.surah.number}:${match.numberInSurah}*\n`;
                    searchResults += `${match.text}\n\n`;
                });
                
                if (json.data.count > 10) {
                    searchResults += `*...and ${json.data.count - 10} more results*\n`;
                }
                
                searchResults += `*Use: quranverse [surah:verse] for full verse*`;
                
                await Bloom.sendMessage(message.key.remoteJid, { 
                    text: searchResults 
                }, { quoted: message });
                
            } catch (error) {
                console.error("Error in quransearch command:", error);
                await Bloom.sendMessage(message.key.remoteJid, { 
                    text: `*Error searching Quran. Try again later.*` 
                }, { quoted: message });
            }
        }
    }
};