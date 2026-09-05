// Migrated from commands/lyrics.js

const fetch = require('node-fetch');
const { getLang } = require('../lib/lang');

// Utility: split long lyrics into safe chunks for WhatsApp
function chunkText(text, size = 3000) {
    const chunks = [];
    for (let i = 0; i < text.length; i += size) {
        chunks.push(text.slice(i, i + size));
    }
    return chunks;
}

async function lyricsCommand(sock, chatId, songTitle) {
    if (!songTitle) {
        await sock.sendMessage(chatId, { 
            text: getLang(sock).lyrics_no_title
        });
        return;
    }

    try {
        // Use David Cyril Tech API v3
        const apiUrl = `https://apis.davidcyriltech.my.id/lyrics3?song=${encodeURIComponent(songTitle)}`;
        const res = await fetch(apiUrl);

        if (!res.ok) {
            throw new Error(await res.text());
        }

        const json = await res.json();
        if (!json.success || !json.result || !json.result.lyrics) {
            await sock.sendMessage(chatId, { 
                text: getLang(sock).lyrics_not_found.replace('{song}', songTitle)
            });
            return;
        }

        const { song, artist, lyrics } = json.result;

        // Prepare header
        const header = `${getLang(sock).lyrics_header}\n\n${getLang(sock).lyrics_title_label} ${song || songTitle}\n${getLang(sock).lyrics_artist_label} ${artist || 'Unknown'}\n\n📜 *Lyrics:*`;

        // Send header first
        await sock.sendMessage(chatId, { text: header });

        // Split long lyrics into chunks
        const parts = chunkText(lyrics);
        for (const part of parts) {
            await sock.sendMessage(chatId, { text: part });
        }

    } catch (error) {
        console.error('Error in lyrics command:', error);
        await sock.sendMessage(chatId, { 
            text: getLang(sock).lyrics_error
        });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['lyrics'],
  description: 'Get song lyrics',
  category: 'tools',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!query) { await sock.sendMessage(chatId, { text: 'Usage: ' + ctx.effectivePrefix + 'lyrics <song name>' }); return; }
  await lyricsCommand(sock, chatId, query);
});