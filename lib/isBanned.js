const fs = require('fs');
const path = require('path');

function _bannedFile(sessionId) {
    return sessionId
        ? path.join(__dirname, '../data/banned_' + sessionId + '.json')
        : path.join(__dirname, '../data/banned.json');
}

function isBanned(userId, sessionId) {
    try {
        const file = _bannedFile(sessionId);
        if (!fs.existsSync(file)) return false;
        const bannedUsers = JSON.parse(fs.readFileSync(file, 'utf8'));
        return bannedUsers.includes(userId);
    } catch (error) {
        console.error('Error checking banned status:', error);
        return false;
    }
}

module.exports = { isBanned };
