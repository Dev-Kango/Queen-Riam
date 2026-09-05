// Migrated from commands/sudo.js

const fs = require('fs');
const path = require('path');
const { getLang } = require('../lib/lang');

// Session-aware sudo file
function _sudoFile(sessionId){
    return sessionId ? path.join(__dirname,'../data/sudo_'+sessionId+'.json') : path.join(__dirname,'../data/sudo.json');
}
const SUDO_FILE = path.join(__dirname, '../data/sudo.json'); // kept for non-session fallback

// Ensure data directory exists
const dataDir = path.dirname(SUDO_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Load sudo users from file
function loadSudoUsers(sessionId) {
    const sf=_sudoFile(sessionId);
    try {
        if (fs.existsSync(sf)) { return JSON.parse(fs.readFileSync(sf, 'utf8')); }
    } catch (error) { console.error('Error loading sudo users:', error); }
    return { users: [] };
}

// Save sudo users to file
function saveSudoUsers(sudoUsers, sessionId) {
    try {
        fs.writeFileSync(_sudoFile(sessionId), JSON.stringify(sudoUsers, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving sudo users:', error);
        return false;
    }
}

// Check if a user is sudo
function isSudoUser(userId, sessionId) {
    const sudoUsers = loadSudoUsers(sessionId);
    const cleanUserId = userId.replace('@s.whatsapp.net', '').replace('@lid', '').replace(/[^0-9]/g, '');
    const isSudo = sudoUsers.users.some(u => u.replace(/[^0-9]/g, '') === cleanUserId);
    return isSudo;
}

// Add sudo user
function addSudoUser(userId, sessionId) {
    const sudoUsers = loadSudoUsers(sessionId);
    const cleanUserId = userId.replace(/[^0-9]/g, '');
    
    console.log(`➕ Adding sudo user: ${cleanUserId}`);
    
    if (!sudoUsers.users.includes(cleanUserId)) {
        sudoUsers.users.push(cleanUserId);
        const success = saveSudoUsers(sudoUsers, sessionId);
        console.log(`📁 Save successful: ${success}`);
        return success;
    }
    return true; // Already exists
}

// Remove sudo user
function removeSudoUser(userId, sessionId) {
    const sudoUsers = loadSudoUsers(sessionId);
    const cleanUserId = userId.replace(/[^0-9]/g, '');
    const index = sudoUsers.users.indexOf(cleanUserId);
    
    if (index > -1) {
        sudoUsers.users.splice(index, 1);
        return saveSudoUsers(sudoUsers, sessionId);
    }
    return true; // Didn't exist
}

// Get all sudo users
function getAllSudoUsers(sessionId) {
    return loadSudoUsers(sessionId).users;
}

// Check if user has sudo/owner privileges
function hasOwnerPrivileges(userId, message, botJid = null, sessionId = null) {
    // fromMe = message sent from the connected account itself
    if (message.key.fromMe) return true;

    const cleanId = userId.replace(/[^0-9]/g, '');

    // Connected bot account is automatically owner — whoever deployed the bot
    if (botJid) {
        const botNum = String(botJid).replace(/[^0-9]/g, '').split(':')[0];
        if (botNum && botNum === cleanId) return true;
    }

    // Check against owner.json (includes the developer/creator number)
    try {
        const _ownerFile = sessionId ? path.join(__dirname,'../data/owner_'+sessionId+'.json') : path.join(__dirname,'../data/owner.json');
        const ownerList = JSON.parse(fs.readFileSync(_ownerFile, 'utf8'));
        if (Array.isArray(ownerList) && ownerList.some(num => String(num).replace(/[^0-9]/g, '') === cleanId)) {
            return true;
        }
    } catch (_) {}

    // Check if user is in sudo list
    return isSudoUser(userId, sessionId);
}

// Main sudo command handler
async function sudoCommand(sock, chatId, message, settings) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const args = text.split(' ').slice(1);
        const command = args[0]?.toLowerCase();
        const targetNumber = args[1];
        
        // Only bot owner can manage sudo users
        if (!message.key.fromMe) {
            await sock.sendMessage(chatId, {
                text: "❌ This command is only for the bot owner!",
                mentions: []
            });
            return;
        }

        if (!command) {
            // Show sudo users list
            const _sid=sock._sessionNumber||null;const sudoUsers = getAllSudoUsers(_sid);
            let userList = '👑 *Sudo Users List*\n\n';
            
            if (sudoUsers.length === 0) {
                userList += 'No sudo users added yet.';
            } else {
                sudoUsers.forEach((user, index) => {
                    userList += `${index + 1}. ${user}\n`;
                });
            }
            
            userList += `\n*Usage:*\n• ${settings.prefix}sudo add <number> - Add sudo user\n• ${settings.prefix}sudo remove <number> - Remove sudo user\n• ${settings.prefix}sudo list - Show all sudo users`;
            
            await sock.sendMessage(chatId, {
                text: userList
            });
            return;
        }

        if (command === 'list') {
            const _sid=sock._sessionNumber||null;const sudoUsers = getAllSudoUsers(_sid);
            let userList = '👑 *Sudo Users List*\n\n';
            
            if (sudoUsers.length === 0) {
                userList += 'No sudo users added yet.';
            } else {
                sudoUsers.forEach((user, index) => {
                    userList += `${index + 1}. ${user}\n`;
                });
                userList += `\nTotal: ${sudoUsers.length} user(s)`;
            }
            
            await sock.sendMessage(chatId, {
                text: userList
            });
            return;
        }

        if (command === 'add' || command === 'remove') {
            if (!targetNumber) {
                await sock.sendMessage(chatId, {
                    text: `❌ Please provide a phone number!\n\nUsage: ${settings.prefix}sudo ${command} 233509977128`
                });
                return;
            }

            // Validate phone number format (basic validation)
            const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
            if (cleanNumber.length < 10 || cleanNumber.length > 15) {
                await sock.sendMessage(chatId, {
                    text: '❌ Invalid phone number format! Please provide a valid number like: 233509977128'
                });
                return;
            }

            const _sid3=sock._sessionNumber||null;
            if (command === 'add') {
                const success = addSudoUser(cleanNumber, _sid3);
                if (success) {
                    await sock.sendMessage(chatId, {
                        text: `✅ *Sudo user added!*\n\nNumber: ${cleanNumber}\n\nThis user now has access to all owner commands.`
                    });
                } else {
                    await sock.sendMessage(chatId, {
                        text: '❌ Failed to add sudo user. Please try again.'
                    });
                }
            } else if (command === 'remove') {
                const success = removeSudoUser(cleanNumber, _sid3);
                if (success) {
                    await sock.sendMessage(chatId, {
                        text: `✅ *Sudo user removed!*\n\nNumber: ${cleanNumber}\n\nThis user no longer has owner privileges.`
                    });
                } else {
                    await sock.sendMessage(chatId, {
                        text: '❌ Failed to remove sudo user. Please try again.'
                    });
                }
            }
            return;
        }

        // Invalid command
        await sock.sendMessage(chatId, {
            text: getLang(sock).sudo_invalid_cmd
        });

    } catch (error) {
        console.error('Error in sudo command:', error);
        await sock.sendMessage(chatId, {
            text: getLang(sock).sudo_error
        });
    }
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['pluginreload'],
  description: 'Reload all plugins without restart',
  category: 'owner',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!hasOwnerPrivileges(ctx.senderId, message, sock.user?.id, ctx.sessionNumber)) {
    await sock.sendMessage(chatId, { text: '❌ Owner only command.' }); return;
  }
  const { loadPlugins, pluginMap } = require('../lib/pluginLoader');
  loadPlugins();
  await sock.sendMessage(chatId, { text: '♻️ Plugins reloaded! ' + pluginMap.size + ' command(s) active.' });
});