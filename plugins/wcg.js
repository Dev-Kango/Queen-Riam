// plugins/wcg.js — Word Chain Game
// Anyone in the chat (group or DM) can reply with the next word in the chain.

const { bot } = require('../lib/pluginLoader');
const { isRealWord, randomWord, TIME_LIMIT_SECONDS } = require('../lib/wordChain');

// chatId -> { lastWord, usedWords: Set, timer }
const games = new Map();

async function endGameOnTimeout(sock, chatId) {
    const game = games.get(chatId);
    if (!game) return;
    games.delete(chatId);
    try {
        await sock.sendMessage(chatId, {
            text: `⏰ *Time's up!* Nobody replied in time.\n\n🎮 *Game over!* Chain length: ${game.usedWords.size} word(s).\n\nType *.wcg* to play again.`
        });
    } catch (_) {}
}

function scheduleTimeout(sock, chatId) {
    return setTimeout(() => endGameOnTimeout(sock, chatId), TIME_LIMIT_SECONDS * 1000);
}

/**
 * Called from main.js for every non-command message.
 * Returns true if the message was consumed as a game move (main.js should stop processing it further).
 */
async function handleWcgMove(sock, chatId, senderId, text) {
    const game = games.get(chatId);
    if (!game) return false;

    const word = String(text || '').trim().toLowerCase();
    // Only treat single alphabetic words as move attempts; anything else (sentences,
    // emojis, links, etc.) is left alone so normal chat/other handlers still work.
    if (!word || !/^[a-z]+$/.test(word)) return false;

    clearTimeout(game.timer);

    const requiredLetter = game.lastWord[game.lastWord.length - 1];
    let failReason = null;
    if (word.length < 3) {
        failReason = 'Words must be at least 3 letters long.';
    } else if (word[0] !== requiredLetter) {
        failReason = `Word must start with *${requiredLetter.toUpperCase()}*.`;
    } else if (game.usedWords.has(word)) {
        failReason = `*${word}* was already used in this game.`;
    } else if (!isRealWord(word)) {
        failReason = `*${word}* isn't a recognized English word.`;
    }

    if (failReason) {
        games.delete(chatId);
        await sock.sendMessage(chatId, {
            text: `❌ ${failReason}\n\n🎮 *Game over!* Chain length: ${game.usedWords.size} word(s).\n\nType *.wcg* to play again.`
        });
        return true;
    }

    game.usedWords.add(word);
    game.lastWord = word;
    const nextLetter = word[word.length - 1].toUpperCase();
    game.timer = scheduleTimeout(sock, chatId);

    await sock.sendMessage(chatId, {
        text: `✅ *${word}* accepted!\n\nNext word must start with *${nextLetter}* (⏱ ${TIME_LIMIT_SECONDS}s)`
    });
    return true;
}

bot({
    command: ['wcg'],
    description: 'Play the Word Chain Game — reply with a word starting with the last letter of the previous one',
    category: 'games',
}, async (sock, chatId, message, args) => {
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'stop' || sub === 'end') {
        const game = games.get(chatId);
        if (!game) {
            await sock.sendMessage(chatId, { text: '❌ No active Word Chain Game here.' });
            return;
        }
        clearTimeout(game.timer);
        games.delete(chatId);
        await sock.sendMessage(chatId, { text: `🛑 Game stopped. Final chain length: ${game.usedWords.size} word(s).` });
        return;
    }

    if (games.has(chatId)) {
        await sock.sendMessage(chatId, { text: '⚠️ A game is already running here! Reply with a word, or type *.wcg stop* to end it.' });
        return;
    }

    const start = randomWord();
    const game = { lastWord: start, usedWords: new Set([start]), timer: null };
    game.timer = scheduleTimeout(sock, chatId);
    games.set(chatId, game);

    await sock.sendMessage(chatId, {
        text: `🔗 *Word Chain Game started!*\n\nStart word: *${start}*\nNext word must start with *${start[start.length - 1].toUpperCase()}*\n\n📜 *Rules:*\n• Real English words only, 3+ letters\n• No repeats\n• ⏱ ${TIME_LIMIT_SECONDS}s per word\n• Type *.wcg stop* to end`
    });
});

module.exports = { handleWcgMove };
