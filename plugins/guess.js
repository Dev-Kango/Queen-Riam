// Migrated from commands/hangman.js

const fs = require('fs');
const { getLang } = require('../lib/lang');

const words = ['javascript', 'bot', 'hangman', 'whatsapp', 'nodejs'];
let hangmanGames = {};

function startHangman(sock, chatId) {
    const word = words[Math.floor(Math.random() * words.length)];
    const maskedWord = '_ '.repeat(word.length).trim();

    hangmanGames[chatId] = {
        word,
        maskedWord: maskedWord.split(' '),
        guessedLetters: [],
        wrongGuesses: 0,
        maxWrongGuesses: 6,
    };

    sock.sendMessage(chatId, { text: getLang(sock).hangman_started.replace('{word}', maskedWord) });
}

function guessLetter(sock, chatId, letter) {
    if (!hangmanGames[chatId]) {
        sock.sendMessage(chatId, { text: getLang(sock).hangman_no_game });
        return;
    }

    const game = hangmanGames[chatId];
    const { word, guessedLetters, maskedWord, maxWrongGuesses } = game;

    if (guessedLetters.includes(letter)) {
        sock.sendMessage(chatId, { text: getLang(sock).hangman_already_guessed.replace('{letter}', letter) });
        return;
    }

    guessedLetters.push(letter);

    if (word.includes(letter)) {
        for (let i = 0; i < word.length; i++) {
            if (word[i] === letter) {
                maskedWord[i] = letter;
            }
        }
        sock.sendMessage(chatId, { text: getLang(sock).hangman_good_guess + ' ' + maskedWord.join(' ') });

        if (!maskedWord.includes('_')) {
            sock.sendMessage(chatId, { text: getLang(sock).hangman_won.replace('{word}', word) });
            delete hangmanGames[chatId];
        }
    } else {
        game.wrongGuesses += 1;
        sock.sendMessage(chatId, { text: getLang(sock).hangman_wrong.replace('{tries}', maxWrongGuesses - game.wrongGuesses) });

        if (game.wrongGuesses >= maxWrongGuesses) {
            sock.sendMessage(chatId, { text: getLang(sock).hangman_over.replace('{word}', word) });
            delete hangmanGames[chatId];
        }
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['guess'],
  description: 'Guess a letter in Hangman',
  category: 'games',
  hidden: true,
}, async (sock, chatId, message, args, query, ctx) => {
  if (!args[0]) { await sock.sendMessage(chatId, { text: 'Usage: ' + ctx.effectivePrefix + 'guess <letter>' }); return; }
  guessLetter(sock, chatId, args[0]);
});