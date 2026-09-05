// Migrated from commands/github.js

const moment = require('moment-timezone');
const fetch  = require('node-fetch');
const { readRandomBrandImage } = require('../lib/imagePicker');
const axios  = require('axios');
const { isButtonModeOn } = require('../lib/buttonHelper');
const { getLang } = require('../lib/lang');
let sendButtons;
try {
    sendButtons = require('kango-wa').sendButtons;
} catch (_) {
    sendButtons = null;
}

async function githubCommand(sock, chatId, message) {
    try {
        const res = await fetch('https://api.github.com/repos/Dev-Kango/Queen-Riam');
        if (!res.ok) throw new Error('Error fetching repository data');
        const repo = await res.json();

        let txt = `*🌹 Queen Riam Repository*\n\n`;
        txt += `🔗 *URL:* ${repo.html_url}\n`;
        txt += `📝 *Description:* ${repo.description || "_No description provided_"}\n`;
        txt += `🌟 *Stars:* ${repo.stargazers_count}\n`;
        txt += `🔀 *Forks:* ${repo.forks_count}\n`;
        txt += `👀 *Watchers:* ${repo.watchers_count}\n`;
        txt += `📦 *Size:* ${(repo.size / 1024).toFixed(2)} MB\n`;
        txt += `📅 *Last Updated:* ${moment(repo.updated_at).format('DD/MM/YY - HH:mm:ss')}\n\n`;
        txt += `👨‍💻 *Developer:* ${repo.owner.login}\n\n`;
        txt += `💥 *QUEEN RIAM*`;

        if (isButtonModeOn() && sendButtons) {
            try {
                await sendButtons(sock, chatId, {
                    text: txt,
                    footer: 'Queen Riam 👑',
                    buttons: [
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: '🔗 Open Repository',
                                url: repo.html_url,
                                merchant_url: repo.html_url,
                            }),
                        },
                        { id: '.repozip', text: '📦 Download ZIP' },
                    ],
                });
            } catch (_) {
                const imgBuffer = readRandomBrandImage();
                await sock.sendMessage(chatId, imgBuffer
                    ? { image: imgBuffer, caption: txt }
                    : { text: txt });
            }
        } else {
            const imgBuffer = readRandomBrandImage();
            await sock.sendMessage(chatId, imgBuffer
                ? { image: imgBuffer, caption: txt }
                : { text: txt });
        }

    } catch (error) {
        console.error('GitHub Command Error:', error);
        await sock.sendMessage(chatId, {
            text: getLang(sock).github_error
        });
    }
}

async function repoZipCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
        await sock.sendMessage(chatId, { text: getLang(sock).github_downloading });

        const zipUrl  = 'https://github.com/Dev-Kango/Queen-Riam/archive/refs/heads/main.zip';
        const response = await axios.get(zipUrl, { responseType: 'arraybuffer', timeout: 60000 });

        await sock.sendMessage(chatId, {
            document: Buffer.from(response.data),
            mimetype: 'application/zip',
            fileName: 'Queen-Riam.zip',
            caption: '📦 *Queen Riam* — Source Code\n\n⭐ Star the repo: https://github.com/Dev-Kango/Queen-Riam',
        });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('RepoZip Error:', error);
        await sock.sendMessage(chatId, {
            text: getLang(sock).github_zip_failed
        });
        await sock.sendMessage(chatId, { react: { text: '⚠️', key: message.key } });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['github', 'git', 'repo'],
  description: 'Get bot source code link',
  category: 'general',
}, async (sock, chatId, message) => {
  await githubCommand(sock, chatId, message);
});