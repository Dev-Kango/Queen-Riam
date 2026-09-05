// Migrated from commands/quiz.js

const questions = require('../data/quizQuestions');
const { isButtonModeOn, sendButtonMessage } = require('../lib/buttonHelper');
let sendButtons;
try {
    sendButtons = require('kango-wa').sendButtons;
} catch (_) {
    sendButtons = null;
}

const TOTAL_QUESTIONS = 10;
const labels = ['A', 'B', 'C', 'D'];
const quizSessions = {};
const categoryNames = {
    bible: '📖 Bible',
    geography: '🌍 Geography',
    science: '🔬 Science',
    history: '📜 History',
    sports: '⚽ Sports',
    entertainment: '🎬 Entertainment',
};

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function getSession(chatId, userId) {
    return quizSessions[`${chatId}_${userId}`];
}

function setSession(chatId, userId, session) {
    quizSessions[`${chatId}_${userId}`] = session;
}

function clearSession(chatId, userId) {
    delete quizSessions[`${chatId}_${userId}`];
}

async function quizCommand(sock, chatId, args, message, userId) {
    const existing = getSession(chatId, userId);
    if (existing) {
        await sock.sendMessage(chatId, {
            text: `⚠️ You already have a quiz in progress!\n\n📂 Category: *${categoryNames[existing.category]}*\nQuestion: *${existing.current + 1}/${TOTAL_QUESTIONS}*\n\nAnswer the current question or use \`.endquiz\` to quit.`
        });
        return;
    }

    const cat = args[0]?.toLowerCase();
    const available = Object.keys(questions);

    if (!cat || !available.includes(cat)) {
        const text =
            `🧠 *Quiz Game*\n\n` +
            `Test your knowledge with ${TOTAL_QUESTIONS} questions!\n\n` +
            `📂 *Available Categories:*\n` +
            available.map(c => `• \`.quiz ${c}\` — ${categoryNames[c]}`).join('\n') +
            `\n\n_Pick a category to start!_`;

        if (isButtonModeOn() && sendButtons) {
            try {
                const buttons = available.map(c => ({
                    id: `.quiz ${c}`,
                    text: categoryNames[c],
                }));
                await sendButtons(sock, chatId, {
                    text,
                    footer: 'Queen Riam 👑',
                    buttons,
                });
            } catch (_) {
                await sock.sendMessage(chatId, { text });
            }
        } else {
            await sock.sendMessage(chatId, { text });
        }
        return;
    }

    const pool = shuffle(questions[cat]).slice(0, TOTAL_QUESTIONS);

    setSession(chatId, userId, {
        category: cat,
        questions: pool,
        current: 0,
        score: 0,
        results: [],
    });

    await sock.sendMessage(chatId, {
        text: `🧠 *Quiz Started!*\n\n📂 Category: *${categoryNames[cat]}*\n📊 Questions: *${TOTAL_QUESTIONS}*\n\n_Let's go!_`
    });

    await sendQuestion(sock, chatId, userId);
}

async function sendQuestion(sock, chatId, userId) {
    const session = getSession(chatId, userId);
    if (!session) return;

    const idx = session.current;
    const q = session.questions[idx];
    const shuffledOptions = shuffle(q.options);
    session.shuffledOptions = shuffledOptions;

    const text =
        `❓ *Question ${idx + 1}/${TOTAL_QUESTIONS}*\n` +
        `📊 Score: *${session.score}/${idx}*\n\n` +
        `*${q.q}*\n\n` +
        shuffledOptions.map((opt, i) => `*${labels[i]}.* ${opt}`).join('\n');

    if (isButtonModeOn() && sendButtons) {
        try {
            const buttons = shuffledOptions.map((opt, i) => ({
                id: `.qa ${opt}`,
                text: `${labels[i]}. ${opt}`,
            }));
            await sendButtons(sock, chatId, {
                text,
                footer: `${categoryNames[session.category]} — ${idx + 1}/${TOTAL_QUESTIONS}`,
                buttons,
            });
        } catch (_) {
            await sock.sendMessage(chatId, {
                text: text + '\n\n_Reply with_ `.qa <your answer>`\n_Or use letter:_ `.qa A`',
            });
        }
    } else {
        await sock.sendMessage(chatId, {
            text: text + '\n\n_Reply with_ `.qa <your answer>`\n_Or use letter:_ `.qa A`',
        });
    }
}

async function quizAnswer(sock, chatId, answerText, message, userId) {
    const session = getSession(chatId, userId);
    if (!session) {
        await sock.sendMessage(chatId, {
            text: '⚠️ No quiz in progress.\n\nStart one with `.quiz`'
        });
        return;
    }

    const q = session.questions[session.current];
    let userAnswer = answerText.trim();

    if (/^[a-dA-D]$/i.test(userAnswer)) {
        const letterIndex = userAnswer.toUpperCase().charCodeAt(0) - 65;
        if (session.shuffledOptions && session.shuffledOptions[letterIndex]) {
            userAnswer = session.shuffledOptions[letterIndex];
        }
    }

    const isCorrect = userAnswer.toLowerCase() === q.answer.toLowerCase();

    if (isCorrect) session.score++;

    session.results.push({
        question: q.q,
        yourAnswer: userAnswer,
        correctAnswer: q.answer,
        correct: isCorrect,
    });

    const feedback = isCorrect
        ? `✅ *Correct!*`
        : `❌ *Wrong!* The answer is *${q.answer}*`;

    session.current++;

    if (session.current >= TOTAL_QUESTIONS) {
        await showResults(sock, chatId, userId, feedback, message);
        return;
    }

    await sock.sendMessage(chatId, {
        text: `${feedback}\n\n_Next question coming..._`
    });

    await sendQuestion(sock, chatId, userId);
}

async function showResults(sock, chatId, userId, lastFeedback, message) {
    const session = getSession(chatId, userId);
    if (!session) return;

    const { score, results, category } = session;
    const total = results.length;
    const pct = Math.round((score / total) * 100);

    let grade, emoji;
    if (pct >= 90)      { grade = 'A+'; emoji = '🏆'; }
    else if (pct >= 80) { grade = 'A';  emoji = '🌟'; }
    else if (pct >= 70) { grade = 'B';  emoji = '👏'; }
    else if (pct >= 60) { grade = 'C';  emoji = '👍'; }
    else if (pct >= 50) { grade = 'D';  emoji = '😅'; }
    else                { grade = 'F';  emoji = '📚'; }

    let text =
        `${lastFeedback}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${emoji} *QUIZ COMPLETE!*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📂 Category: *${categoryNames[category]}*\n` +
        `📊 Score: *${score}/${total}* (${pct}%)\n` +
        `📝 Grade: *${grade}*\n\n`;

    const wrong = results.filter(r => !r.correct);
    if (wrong.length > 0) {
        text += `❌ *Questions you missed:*\n\n`;
        wrong.forEach((r, i) => {
            text += `${i + 1}. _${r.question}_\n`;
            text += `   Your answer: _${r.yourAnswer}_\n`;
            text += `   Correct: *${r.correctAnswer}*\n\n`;
        });
    } else {
        text += `🎉 *Perfect score! You got every question right!*\n\n`;
    }

    clearSession(chatId, userId);

    if (isButtonModeOn()) {
        await sendButtonMessage(sock, chatId, {
            text,
            footer: 'Queen Riam 👑',
            buttons: [
                { id: `.quiz ${category}`, text: `🔄 Play ${categoryNames[category]} Again` },
                { id: '.quiz',             text: '📂 Pick Category' },
            ],
        }, message);
    } else {
        await sock.sendMessage(chatId, { text });
    }
}

async function endQuiz(sock, chatId, message, userId) {
    const session = getSession(chatId, userId);
    if (!session) {
        await sock.sendMessage(chatId, {
            text: '⚠️ No quiz in progress.'
        });
        return;
    }

    const { score, current, category } = session;
    clearSession(chatId, userId);

    const text =
        `🛑 *Quiz Ended*\n\n` +
        `📂 Category: *${categoryNames[category]}*\n` +
        `📊 Score: *${score}/${current}* (answered ${current} of ${TOTAL_QUESTIONS})`;

    if (isButtonModeOn()) {
        await sendButtonMessage(sock, chatId, {
            text,
            footer: 'Queen Riam 👑',
            buttons: [
                { id: '.quiz', text: '🧠 New Quiz' },
            ],
        }, message);
    } else {
        await sock.sendMessage(chatId, { text });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['qa'],
  description: 'Answer a quiz question',
  category: 'games',
  hidden: true,
}, async (sock, chatId, message, args, query, ctx) => {
  const ans = args.join(' ');
  if (!ans) { await sock.sendMessage(chatId, { text: 'Usage: ' + ctx.effectivePrefix + 'qa <answer>' }); return; }
  await quizAnswer(sock, chatId, ans, message, ctx.senderId);
});