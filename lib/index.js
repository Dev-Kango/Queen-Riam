const fs = require('fs');
const path = require('path');

// Session-aware userGroupData path
function _ugdPath(sessionId) {
    return sessionId
        ? path.join(__dirname, '../data/userGroupData_' + sessionId + '.json')
        : path.join(__dirname, '../data/userGroupData.json');
}
const _UGD_DEFAULT = { antibadword: {}, antilink: {}, welcome: {}, goodbye: {}, chatbot: {}, warnings: {} };

// Function to load user and group data from JSON file
function loadUserGroupData(sessionId) {
    try {
        const dataPath = _ugdPath(sessionId);
        if (!fs.existsSync(dataPath)) {
            const defaultData = JSON.parse(JSON.stringify(_UGD_DEFAULT));
            fs.writeFileSync(dataPath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        return data;
    } catch (error) {
        console.error('Error loading user group data:', error);
        return JSON.parse(JSON.stringify(_UGD_DEFAULT));
    }
}

// Function to save user and group data to JSON file
function saveUserGroupData(data, sessionId) {
    try {
        const dataPath = _ugdPath(sessionId);
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving user group data:', error);
        return false;
    }
}

// Add these functions to your SQL helper file
async function setAntilink(groupId, type, action, sessionId) {
    try {
        const data = loadUserGroupData(sessionId);
        if (!data.antilink) data.antilink = {};
        if (!data.antilink[groupId]) data.antilink[groupId] = {};
        
        data.antilink[groupId] = {
            enabled: type === 'on',
            action: action || 'delete' // Set default action to delete
        };
        
        saveUserGroupData(data, sessionId);
        return true;
    } catch (error) {
        console.error('Error setting antilink:', error);
        return false;
    }
}

async function getAntilink(groupId, type, sessionId) {
    try {
        const data = loadUserGroupData(sessionId);
        if (!data.antilink || !data.antilink[groupId]) return null;
        
        return type === 'on' ? data.antilink[groupId] : null;
    } catch (error) {
        console.error('Error getting antilink:', error);
        return null;
    }
}

async function removeAntilink(groupId, type, sessionId) {
    try {
        const data = loadUserGroupData(sessionId);
        if (data.antilink && data.antilink[groupId]) {
            delete data.antilink[groupId];
            saveUserGroupData(data, sessionId);
        }
        return true;
    } catch (error) {
        console.error('Error removing antilink:', error);
        return false;
    }
}

// Add these functions for warning system
async function incrementWarningCount(groupId, userId, sessionId) {
    try {
        const data = loadUserGroupData(sessionId);
        if (!data.warnings) data.warnings = {};
        if (!data.warnings[groupId]) data.warnings[groupId] = {};
        if (!data.warnings[groupId][userId]) data.warnings[groupId][userId] = 0;
        
        data.warnings[groupId][userId]++;
        saveUserGroupData(data, sessionId);
        return data.warnings[groupId][userId];
    } catch (error) {
        console.error('Error incrementing warning count:', error);
        return 0;
    }
}

async function resetWarningCount(groupId, userId, sessionId) {
    try {
        const data = loadUserGroupData(sessionId);
        if (data.warnings && data.warnings[groupId] && data.warnings[groupId][userId]) {
            data.warnings[groupId][userId] = 0;
            saveUserGroupData(data, sessionId);
        }
        return true;
    } catch (error) {
        console.error('Error resetting warning count:', error);
        return false;
    }
}

// Add sudo check function
async function isSudo(userId, sessionId) {
    try {
        const data = loadUserGroupData(sessionId);
        return data.sudo && data.sudo.includes(userId);
    } catch (error) {
        console.error('Error checking sudo:', error);
        return false;
    }
}

// Add these functions
async function addWelcome(jid, enabled, message, sessionId) {
    try {
        const data = loadUserGroupData(sessionId);
        if (!data.welcome) data.welcome = {};
        
        data.welcome[jid] = {
            enabled: enabled,
            message: message || '╔═⚔️ WELCOME ⚔️═╗\n║ 🛡️ User: {user}\n║ 🏰 Kingdom: {group}\n╠═══════════════╣\n║ 📜 Message:\n║ {description}\n╚═══════════════╝',
            channelId: '120363404284793169@newsletter'
        };
        
        saveUserGroupData(data, sessionId);
        return true;
    } catch (error) {
        console.error('Error in addWelcome:', error);
        return false;
    }
}

async function delWelcome(jid, sessionId) {
    try {
        const data = loadUserGroupData(sessionId);
        if (data.welcome && data.welcome[jid]) {
            delete data.welcome[jid];
            saveUserGroupData(data, sessionId);
        }
        return true;
    } catch (error) {
        console.error('Error in delWelcome:', error);
        return false;
    }
}

async function isWelcomeOn(jid, sessionId) {
    try {
        const data = loadUserGroupData(sessionId);
        return data.welcome && data.welcome[jid] && data.welcome[jid].enabled;
    } catch (error) {
        console.error('Error in isWelcomeOn:', error);
        return false;
    }
}

async function addGoodbye(jid, enabled, message, sessionId) {
    try {
        const data = loadUserGroupData(sessionId);
        if (!data.goodbye) data.goodbye = {};
        
        data.goodbye[jid] = {
            enabled: enabled,
            message: message || '╔═⚔️ GOODBYE ⚔️═╗\n║ 🛡️ User: {user}\n║ 🏰 Kingdom: {group}\n╠═══════════════╣\n║ ⚰️ We will never miss you!\n╚═══════════════╝',
            channelId: '120363404284793169@newsletter'
        };
        
        saveUserGroupData(data, sessionId);
        return true;
    } catch (error) {
        console.error('Error in addGoodbye:', error);
        return false;
    }
}

async function delGoodBye(jid, sessionId) {
    try {
        const data = loadUserGroupData(sessionId);
        if (data.goodbye && data.goodbye[jid]) {
            delete data.goodbye[jid];
            saveUserGroupData(data, sessionId);
        }
        return true;
    } catch (error) {
        console.error('Error in delGoodBye:', error);
        return false;
    }
}

async function isGoodByeOn(jid, sessionId) {
    try {
        const data = loadUserGroupData(sessionId);
        return data.goodbye && data.goodbye[jid] && data.goodbye[jid].enabled;
    } catch (error) {
        console.error('Error in isGoodByeOn:', error);
        return false;
    }
}

// Add these functions to your existing SQL helper file
async function setAntiBadword(groupId, type, action, sessionId) {
    try {
        const data = loadUserGroupData(sessionId);
        if (!data.antibadword) data.antibadword = {};
        if (!data.antibadword[groupId]) data.antibadword[groupId] = {};
        
        data.antibadword[groupId] = {
            enabled: type === 'on',
            action: action || 'delete'
        };
        
        saveUserGroupData(data, sessionId);
        return true;
    } catch (error) {
        console.error('Error setting antibadword:', error);
        return false;
    }
}

async function getAntiBadword(groupId, type, sessionId) {
    try {
        const data = loadUserGroupData(sessionId);
        //console.log('Loading antibadword config for group:', groupId);
        //console.log('Current data:', data.antibadword);
        
        if (!data.antibadword || !data.antibadword[groupId]) {
            console.log('No antibadword config found');
            return null;
        }
        
        const config = data.antibadword[groupId];
       // console.log('Found config:', config);
        
        return type === 'on' ? config : null;
    } catch (error) {
        console.error('Error getting antibadword:', error);
        return null;
    }
}

async function removeAntiBadword(groupId, type, sessionId) {
    try {
        const data = loadUserGroupData(sessionId);
        if (data.antibadword && data.antibadword[groupId]) {
            delete data.antibadword[groupId];
            saveUserGroupData(data, sessionId);
        }
        return true;
    } catch (error) {
        console.error('Error removing antibadword:', error);
        return false;
    }
}

async function setChatbot(groupId, enabled, sessionId) {
    try {
        const data = loadUserGroupData(sessionId);
        if (!data.chatbot) data.chatbot = {};
        
        data.chatbot[groupId] = {
            enabled: enabled
        };
        
        saveUserGroupData(data, sessionId);
        return true;
    } catch (error) {
        console.error('Error setting chatbot:', error);
        return false;
    }
}

async function getChatbot(groupId, sessionId) {
    try {
        const data = loadUserGroupData(sessionId);
        return data.chatbot?.[groupId] || null;
    } catch (error) {
        console.error('Error getting chatbot:', error);
        return null;
    }
}

async function removeChatbot(groupId, sessionId) {
    try {
        const data = loadUserGroupData(sessionId);
        if (data.chatbot && data.chatbot[groupId]) {
            delete data.chatbot[groupId];
            saveUserGroupData(data, sessionId);
        }
        return true;
    } catch (error) {
        console.error('Error removing chatbot:', error);
        return false;
    }
}

/* ── Anti Group Tag ──────────────────────────── */
async function setAntiGroupTag(groupId, action, sessionId) {
    const data = loadUserGroupData(sessionId);
    if (!data.antigrouptag) data.antigrouptag = {};
    data.antigrouptag[groupId] = { enabled: true, action: action || "delete" };
    saveUserGroupData(data, sessionId);
    return true;
}
async function getAntiGroupTag(groupId, sessionId) {
    const data = loadUserGroupData(sessionId);
    return data.antigrouptag?.[groupId] || null;
}
async function removeAntiGroupTag(groupId, sessionId) {
    const data = loadUserGroupData(sessionId);
    if (data.antigrouptag?.[groupId]) { delete data.antigrouptag[groupId]; saveUserGroupData(data, sessionId); }
    return true;
}

module.exports = {
    loadUserGroupData,
    saveUserGroupData,
    // ... existing exports
    setAntilink,
    getAntilink,
    removeAntilink,
    incrementWarningCount,
    resetWarningCount,
    isSudo,
    addWelcome,
    delWelcome,
    isWelcomeOn,
    addGoodbye,
    delGoodBye,
    isGoodByeOn,
    setAntiBadword,
    getAntiBadword,
    removeAntiBadword,
    setChatbot,
    getChatbot,
    removeChatbot,
}; 