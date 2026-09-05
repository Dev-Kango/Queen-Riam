// Post a text or media status update inside the current group

const isOwner = require('../lib/isOwner');
const isAdmin = require('../lib/isAdmin');
const { downloadMediaMessage, prepareWAMessageMedia, generateWAMessageFromContent } = require('@whiskeysockets/baileys');

async function gstatusCommand(sock, chatId, senderId, query, message) {
    const text = (query || '').trim();

    const quotedInfo = message.message?.extendedTextMessage?.contextInfo;
    const hasQuoted = !!quotedInfo?.quotedMessage;

    let targetMessage = message;
    if (hasQuoted) {
        targetMessage = {
            key: { remoteJid: chatId, id: quotedInfo.stanzaId, participant: quotedInfo.participant },
            message: quotedInfo.quotedMessage
        };
    }

    const qMsg = targetMessage.message;
    const isImage = !!qMsg?.imageMessage;
    const isVideo = !!qMsg?.videoMessage;
    const isAudio = !!qMsg?.audioMessage;
    const hasMedia = hasQuoted && (isImage || isVideo || isAudio);

    if (!text && !hasMedia) {
        await sock.sendMessage(chatId, { text: '⚠️ Usage: .gstatus <text> (or reply to an image/video/audio)' });
        return;
    }

    try {
        if (hasMedia) {
            const raw = await downloadMediaMessage(targetMessage, 'buffer', {}, {
                logger: undefined, reuploadRequest: sock.updateMediaMessage
            });

            let mediaContent;
            if (isImage) {
                mediaContent = { image: raw, caption: text || undefined };
            } else if (isVideo) {
                mediaContent = { video: raw, caption: text || undefined, gifPlayback: false };
            } else {
                const mime = qMsg.audioMessage.mimetype || 'audio/mpeg';
                mediaContent = { audio: raw, mimetype: mime, ptt: true };
            }

            const prepared = await prepareWAMessageMedia(mediaContent, { upload: sock.waUploadToServer });
            const innerKey = isImage ? 'imageMessage' : isVideo ? 'videoMessage' : 'audioMessage';

            const groupStatusMsg = generateWAMessageFromContent(
                chatId,
                {
                    groupStatusMessageV2: {
                        message: {
                            [innerKey]: prepared[innerKey]
                        }
                    }
                },
                { userJid: sock.user.id, timestamp: new Date() }
            );

            await sock.relayMessage(chatId, groupStatusMsg.message, { messageId: groupStatusMsg.key.id });

            await sock.sendMessage(chatId, { text: '✅ Media status posted to group.' });
        } else {
            const built = {
                groupStatusMessageV2: {
                    message: {
                        extendedTextMessage: {
                            text,
                            textArgb: 0xFFFFFFFF,
                            backgroundArgb: 0xFF121212,
                            font: 5,
                            previewType: 0,
                            contextInfo: {
                                forwardingScore: 0,
                                featureEligibilities: {
                                    canBeReshared: true,
                                    canReceiveMultiReact: true
                                },
                                statusSourceType: 4,
                                statusAttributions: [{ type: 10 }],
                                statusAudienceMetadata: { audienceType: 1 }
                            },
                            inviteLinkGroupTypeV2: 0
                        }
                    }
                }
            };

            await sock.relayMessage(chatId, built, {
                messageId: sock.generateMessageTag()
            });

            await sock.sendMessage(chatId, { text: '✅ Status posted to group.' });
        }
    } catch (error) {
        console.error('Error in gstatus command:', error.message);
        await sock.sendMessage(chatId, { text: '❌ Failed to post group status: ' + error.message });
    }
}

const { bot } = require('../lib/pluginLoader');

bot({
  command: ['gstatus'],
  description: 'Post a text or media status update in the current group',
  category: 'group',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!ctx.isGroup) {
    await sock.sendMessage(chatId, { text: '⚠️ This command only works inside a group.' });
    return;
  }

  const owner = isOwner(ctx.senderId);
  let senderIsAdmin = false;
  if (!owner) {
    const adminCheck = await isAdmin(sock, chatId, ctx.senderId);
    senderIsAdmin = adminCheck.isSenderAdmin;
  }

  if (!owner && !senderIsAdmin) {
    await sock.sendMessage(chatId, { text: '⛔ Only the bot owner or a group admin can use this command.' });
    return;
  }

  await gstatusCommand(sock, chatId, ctx.senderId, query, message);
});
