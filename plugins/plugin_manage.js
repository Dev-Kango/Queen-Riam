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

const axios = require('axios');

async function resolveGistUrl(url) {
  const match = url.match(/gist\.github\.com\/([^/]+)\/([a-f0-9]+)/i);
  if (!match) return [url];
  const gistId = match[2];
  const apiUrl = 'https://api.github.com/gists/' + gistId;
  const res = await axios.get(apiUrl, { timeout: 10000 });
  const files = res.data.files;
  return Object.values(files)
    .filter(f => f.filename.endsWith('.js'))
    .map(f => f.raw_url);
}

module.exports = { hasOwnerPrivileges, sudoCommand };

const { bot } = require('../lib/pluginLoader');
const pendingDependencyInstalls = new Map();
const PENDING_INSTALL_TTL = 10 * 60 * 1000;

function pendingInstallKey(chatId, sessionNumber) {
  return String(sessionNumber || 'default') + ':' + chatId;
}

bot({
  command: ['plugin'],
  description: 'Install a plugin from URL or manage plugins (list)',
  category: 'owner',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!hasOwnerPrivileges(ctx.senderId, message, sock.user?.id, ctx.sessionNumber)) {
    await sock.sendMessage(chatId, { text: '\u274c Owner only command.' }); return;
  }

  const {
    installPlugin,
    downloadPlugin,
    getPluginDependencies,
    getMissingDependencies,
    installMissingDependencies,
    pluginMap,
  } = require('../lib/pluginLoader');
  const sub = query?.trim() || '';
  const subLower = sub.toLowerCase();
  const pendingKey = pendingInstallKey(chatId, ctx.sessionNumber);

  if (subLower === 'cancel' || subLower === 'no') {
    if (!pendingDependencyInstalls.has(pendingKey)) {
      await sock.sendMessage(chatId, { text: '\u2139\ufe0f No pending plugin installation.' });
      return;
    }
    pendingDependencyInstalls.delete(pendingKey);
    await sock.sendMessage(chatId, { text: '\u274c Plugin installation cancelled. The downloaded file was kept in eplugins but not loaded.' });
    return;
  }

  if (subLower === 'confirm' || subLower === 'yes') {
    const pending = pendingDependencyInstalls.get(pendingKey);
    if (!pending) {
      await sock.sendMessage(chatId, { text: '\u2139\ufe0f No pending plugin installation.' });
      return;
    }
    if (Date.now() > pending.expiresAt) {
      pendingDependencyInstalls.delete(pendingKey);
      await sock.sendMessage(chatId, { text: '\u23f3 The pending plugin installation expired. Please send the plugin URL again.' });
      return;
    }

    try {
      await sock.sendMessage(chatId, { react: { text: '\u23f3', key: message.key } });
      const installedPackages = await installMissingDependencies(pending.dependencies);
      let installed = [];
      for (const filePath of pending.filePaths) {
        installed = installed.concat(installPlugin(filePath));
      }
      pendingDependencyInstalls.delete(pendingKey);
      await sock.sendMessage(chatId, { react: { text: '\u2705', key: message.key } });
      await sock.sendMessage(chatId, {
        text: '\u2705 *Plugin installed!*\n\n' +
          (installedPackages.length
            ? '\u{1F4E6} Packages installed: ' + installedPackages.join(', ') + '\n\n'
            : '\u{1F4E6} Required packages were already available.\n\n') +
          '\u{1F4CC} Commands added:\n' +
          (installed.length ? installed.map(c => '\u2022 .' + c).join('\n') : '\u2022 No new commands') +
          '\n\n\u{1F4CA} Total: ' + pluginMap.size + ' commands active',
      });
    } catch (err) {
      await sock.sendMessage(chatId, { react: { text: '\u274c', key: message.key } });
      await sock.sendMessage(chatId, { text: '\u274c Failed: ' + err.message + '\n\nYou can try `.plugin confirm` again after fixing the package issue.' });
    }
    return;
  }

  if (sub === 'list' || sub === '') {
    const fs2 = require('fs'), path2 = require('path');
    const epluginDir = path2.join(__dirname, '../eplugins');
    const files = fs2.existsSync(epluginDir) ? fs2.readdirSync(epluginDir).filter(f => f.endsWith('.js')) : [];
    if (!files.length) {
      await sock.sendMessage(chatId, { text: '\u{1F4E6} No URL-installed plugins.\n\nInstall one: .plugin <gist_url>' }); return;
    }
    let msg = '\u{1F4E6} *Installed URL Plugins:*\n\n';
    for (const f of files) msg += '\u2022 ' + f.replace('.js','') + '\n';
    msg += '\n_Remove: .remove <name>_';
    await sock.sendMessage(chatId, { text: msg }); return;
  }

  if (!sub.startsWith('http')) {
    await sock.sendMessage(chatId, { text: '\u274c Usage:\n\u2022 .plugin list\n\u2022 .plugin <github_gist_url>\n\u2022 .plugin confirm\n\u2022 .plugin cancel' }); return;
  }

  try {
    await sock.sendMessage(chatId, { react: { text: '\u23f3', key: message.key } });
    let rawUrls = sub.includes('gist.github.com') ? await resolveGistUrl(sub) : [sub];
    if (!rawUrls.length) {
      await sock.sendMessage(chatId, { text: '\u274c No JS files found at that URL.' }); return;
    }
    const filePaths = [];
    const dependencies = [];
    for (const rawUrl of rawUrls) {
      const savedPath = await downloadPlugin(rawUrl);
      filePaths.push(savedPath);
      dependencies.push(...getPluginDependencies(savedPath));
    }

    const uniqueDependencies = [...new Set(dependencies)];
    const missing = getMissingDependencies(uniqueDependencies);
    if (missing.length) {
      pendingDependencyInstalls.set(pendingKey, {
        filePaths,
        dependencies: uniqueDependencies,
        expiresAt: Date.now() + PENDING_INSTALL_TTL,
      });
      await sock.sendMessage(chatId, { react: { text: '\u{1F4E6}', key: message.key } });
      await sock.sendMessage(chatId, {
        text: '\u26a0\ufe0f *This plugin needs packages that are not installed:*\n\n' +
          missing.map(pkg => '\u2022 ' + pkg).join('\n') +
          '\n\nReply with `.plugin confirm` to install them and activate the plugin, or `.plugin cancel` to cancel.',
      });
      return;
    }

    let installed = [];
    for (const filePath of filePaths) {
      installed = installed.concat(installPlugin(filePath));
    }
    await sock.sendMessage(chatId, { react: { text: '\u2705', key: message.key } });
    await sock.sendMessage(chatId, {
      text: '\u2705 *Plugin installed!*\n\n\u{1F4CC} Commands added:\n' + installed.map(c => '\u2022 .' + c).join('\n') + '\n\n\u{1F4CA} Total: ' + pluginMap.size + ' commands active'
    });
  } catch (err) {
    await sock.sendMessage(chatId, { react: { text: '\u274c', key: message.key } });
    await sock.sendMessage(chatId, { text: '\u274c Failed: ' + err.message });
  }
});

bot({
  command: ['remove'],
  description: 'Remove an installed plugin',
  category: 'owner',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!hasOwnerPrivileges(ctx.senderId, message, sock.user?.id, ctx.sessionNumber)) {
    await sock.sendMessage(chatId, { text: '\u274c Owner only command.' }); return;
  }
  const { removePlugin, pluginMap } = require('../lib/pluginLoader');
  const name = query?.trim();
  if (!name) {
    await sock.sendMessage(chatId, { text: '\u274c Usage: .remove <plugin_name>' }); return;
  }
  try {
    removePlugin(name);
    await sock.sendMessage(chatId, { text: '\u2705 Plugin *' + name + '* removed. ' + pluginMap.size + ' commands active.' });
  } catch (err) {
    await sock.sendMessage(chatId, { text: '\u274c ' + err.message });
  }
});

bot({
  command: ['reloadplugins'],
  description: 'Reload all plugins',
  category: 'owner',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!hasOwnerPrivileges(ctx.senderId, message, sock.user?.id, ctx.sessionNumber)) {
    await sock.sendMessage(chatId, { text: '\u274c Owner only command.' }); return;
  }
  const { loadPlugins, pluginMap } = require('../lib/pluginLoader');
  loadPlugins();
  await sock.sendMessage(chatId, { text: '\u2705 Plugins reloaded. ' + pluginMap.size + ' commands active.' });
});
