'use strict';

function addJidVariants(target, value) {
    if (!value) return;
    const raw = String(value);
    const at = raw.indexOf('@');
    const local = at >= 0 ? raw.slice(0, at) : raw;
    const domain = at >= 0 ? raw.slice(at + 1) : '';
    const bare = local.split(':')[0];
    if (!bare) return;

    target.add(raw);
    target.add(`${bare}@${domain || 's.whatsapp.net'}`);
    if (domain === 's.whatsapp.net') target.add(`${bare}@lid`);
    if (domain === 'lid') target.add(`${bare}@s.whatsapp.net`);
}

function participantMatches(participant, candidates) {
    return [
        participant?.id,
        participant?.jid,
        participant?.lid,
        participant?.phoneNumber,
        participant?.phone,
    ].some(value => {
        const variants = new Set();
        addJidVariants(variants, value);
        return [...variants].some(candidate => candidates.has(candidate));
    });
}

async function isAdmin(sock, chatId, senderId) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = Array.isArray(groupMetadata?.participants)
            ? groupMetadata.participants
            : [];

        const senderCandidates = new Set();
        addJidVariants(senderCandidates, senderId);
        const sender = participants.find(participant => participantMatches(participant, senderCandidates));

        const botCandidates = new Set();
        addJidVariants(botCandidates, sock.user?.id);
        addJidVariants(botCandidates, sock.user?.lid);
        addJidVariants(botCandidates, sock.user?.jid);
        const bot = participants.find(participant => participantMatches(participant, botCandidates));

        const isAdminRole = participant => participant && (
            participant.admin === 'admin' || participant.admin === 'superadmin'
        );

        return {
            isSenderAdmin: Boolean(isAdminRole(sender)),
            isBotAdmin: Boolean(isAdminRole(bot)),
        };
    } catch (error) {
        console.error('Error in isAdmin:', error);
        return { isSenderAdmin: false, isBotAdmin: false };
    }
}

module.exports = isAdmin;
