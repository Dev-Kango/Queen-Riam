// Migrated from commands/warn.js

const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');
const { getLang } = require('../lib/lang');

const databaseDir = path.join(process.cwd(), 'data');
function _warningsPath(sock){const sid=sock&&sock._sessionNumber?sock._sessionNumber:null;return sid?path.join(databaseDir,'warnings_'+sid+'.json'):path.join(databaseDir,'warnings.json');}
function initializeWarningsFile(sock) {
    if (!fs.existsSync(databaseDir)) fs.mkdirSync(databaseDir, { recursive: true });
    const wp=_warningsPath(sock);
    if (!fs.existsSync(wp)) fs.writeFileSync(wp, JSON.stringify({}), 'utf8');
}

async function warnCommand(sock, chatId, senderId, mentionedJids, message) {
    try {
        initializeWarningsFile(sock);

        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: getLang(sock).common_groups_only });
            return;
        }

        try {
            const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { text: getLang(sock).common_bot_not_admin });
                return;
            }
            if (!isSenderAdmin) {
                await sock.sendMessage(chatId, { text: getLang(sock).common_user_not_admin });
                return;
            }
        } catch (adminError) {
            console.error('Error checking admin status:', adminError);
            await sock.sendMessage(chatId, { text: getLang(sock).common_admin_check_failed });
            return;
        }

        let userToWarn;
        if (mentionedJids && mentionedJids.length > 0) {
            userToWarn = mentionedJids[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToWarn = message.message.extendedTextMessage.contextInfo.participant;
        }

        if (!userToWarn) {
            await sock.sendMessage(chatId, { text: getLang(sock).warn_no_target });
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            const _wp=_warningsPath(sock);
            let warnings = {};
            try { warnings = JSON.parse(fs.readFileSync(_wp, 'utf8')); } catch (_) { warnings = {}; }

            if (!warnings[chatId]) warnings[chatId] = {};
            if (!warnings[chatId][userToWarn]) warnings[chatId][userToWarn] = 0;
            warnings[chatId][userToWarn]++;
            fs.writeFileSync(_wp, JSON.stringify(warnings, null, 2));

            const t = getLang(sock);
            const warningMessage =
                `${t.warn_title}\n\n` +
                `${t.warn_user_label} @${userToWarn.split('@')[0]}\n` +
                `${t.warn_count_label} ${warnings[chatId][userToWarn]}/3\n` +
                `${t.warn_by_label} @${senderId.split('@')[0]}\n\n` +
                `${t.warn_date_label} ${new Date().toLocaleString()}`;

            await sock.sendMessage(chatId, { text: warningMessage, mentions: [userToWarn, senderId] });

            if (warnings[chatId][userToWarn] >= 3) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                await sock.groupParticipantsUpdate(chatId, [userToWarn], "remove");
                delete warnings[chatId][userToWarn];
                fs.writeFileSync(_wp, JSON.stringify(warnings, null, 2));

                const kickMessage =
                    `${t.warn_autokick_title}\n\n` +
                    t.warn_autokick_msg.replace('@{user}', `@${userToWarn.split('@')[0]}`);

                await sock.sendMessage(chatId, { text: kickMessage, mentions: [userToWarn] });
            }
        } catch (error) {
            console.error('Error in warn command:', error);
            await sock.sendMessage(chatId, { text: getLang(sock).warn_failed });
        }
    } catch (error) {
        console.error('Error in warn command:', error);
        if (error.data === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
                await sock.sendMessage(chatId, { text: getLang(sock).common_rate_limit });
            } catch (retryError) {
                console.error('Error sending retry message:', retryError);
            }
        } else {
            try {
                await sock.sendMessage(chatId, { text: getLang(sock).warn_failed_perms });
            } catch (sendError) {
                console.error('Error sending error message:', sendError);
            }
        }
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['warn'],
  description: 'Warn a group member',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  const jids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  await warnCommand(sock, chatId, ctx.senderId, jids, message);
});