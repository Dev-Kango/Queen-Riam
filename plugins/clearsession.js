// Migrated from commands/clearsession.js
const { hasOwnerPrivileges } = require('./sudo');

const fs = require('fs');
const path = require('path');
const os = require('os');

const { getLang } = require('../lib/lang');

async function clearSessionCommand(sock, chatId, msg) {
    try {
        // Check if sender is owner
        if (!hasOwnerPrivileges((msg.key.participantAlt || msg.key.participant || msg.key.remoteJidAlt || msg.key.remoteJid), msg, sock.user?.id, sock._sessionNumber)) {
            await sock.sendMessage(chatId, { 
                text: getLang(sock).clearsession_owner_only
            });
            return;
        }

        // Define session directory
        const sessionDir = path.join(__dirname, '../session');

        if (!fs.existsSync(sessionDir)) {
            await sock.sendMessage(chatId, { 
                text: getLang(sock).clearsession_not_found
            });
            return;
        }

        let filesCleared = 0;
        let errors = 0;
        let errorDetails = [];

        // Send initial status
        await sock.sendMessage(chatId, { 
            text: `🔍 Optimizing session files for better performance...`
        });

        const files = fs.readdirSync(sessionDir);
        
        // Count files by type for optimization
        let appStateSyncCount = 0;
        let preKeyCount = 0;

        for (const file of files) {
            if (file.startsWith('app-state-sync-')) appStateSyncCount++;
            if (file.startsWith('pre-key-')) preKeyCount++;
        }

        // Delete files
        for (const file of files) {
            if (file === 'creds.json') {
                // Skip creds.json file
                continue;
            }
            try {
                const filePath = path.join(sessionDir, file);
                fs.unlinkSync(filePath);
                filesCleared++;
            } catch (error) {
                errors++;
                errorDetails.push(`Failed to delete ${file}: ${error.message}`);
            }
        }

        // Send completion message
        const message = `✅ Session files cleared successfully!\n\n` +
                       `📊 Statistics:\n` +
                       `• Total files cleared: ${filesCleared}\n` +
                       `• App state sync files: ${appStateSyncCount}\n` +
                       `• Pre-key files: ${preKeyCount}\n` +
                       (errors > 0 ? `\n⚠️ Errors encountered: ${errors}\n${errorDetails.join('\n')}` : '');

        await sock.sendMessage(chatId, { 
            text: message
        });

    } catch (error) {
        console.error('Error in clearsession command:', error);
        await sock.sendMessage(chatId, { 
            text: getLang(sock).clearsession_failed
        });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['clearsession'],
  description: 'Clear WhatsApp session data',
  category: 'owner',
}, async (sock, chatId, message) => {
  await clearSessionCommand(sock, chatId, message);
});