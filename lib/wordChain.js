// lib/wordChain.js — offline word validation + random word helper for the Word Chain Game

const fs = require('fs');

const TIME_LIMIT_SECONDS = 30;
const MIN_WORD_LENGTH = 3;

let WORD_SET = null;
let WORD_ARRAY = null;

function loadWords() {
    if (WORD_SET) return;
    const listPath = (require('word-list').default) || require('word-list');
    const raw = fs.readFileSync(listPath, 'utf8').split('\n').filter(Boolean);
    WORD_ARRAY = raw.filter(w => w.length >= MIN_WORD_LENGTH && /^[a-z]+$/.test(w));
    WORD_SET = new Set(WORD_ARRAY);
}

function isRealWord(word) {
    loadWords();
    return WORD_SET.has(String(word || '').toLowerCase());
}

function randomWord() {
    loadWords();
    return WORD_ARRAY[Math.floor(Math.random() * WORD_ARRAY.length)];
}

module.exports = { isRealWord, randomWord, TIME_LIMIT_SECONDS, MIN_WORD_LENGTH };
