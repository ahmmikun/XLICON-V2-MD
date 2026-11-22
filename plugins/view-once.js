const { downloadMediaMessage, downloadContentFromMessage } = require('@whiskeysockets/baileys');

function unwrapMessage(message) {
    let cur = message;
    let isViewOnce = false;

    for (let i = 0; i < 6 && cur; i++) {
        const vo =
            cur.viewOnceMessage ||
            cur.viewOnceMessageV2 ||
            cur.viewOnceMessageV2Extension;

        if (vo?.message) {
            isViewOnce = true;
            cur = vo.message;
            continue;
        }

        const wrap =
            cur.ephemeralMessage ||
            cur.documentWithCaptionMessage;

        if (wrap?.message) {
            cur = wrap.message;
            continue;
        }

        break;
    }

    const type = cur?.imageMessage
        ? 'image'
        : cur?.videoMessage
            ? 'video'
            : cur?.audioMessage
                ? 'audio'
                : null;

    const media = type ? cur[`${type}Message`] : null;

    return { cur, type, media, isViewOnce };
}

module.exports = {
    name: 'viewonce',
    description: 'Download view once messages',
    aliases: ['vv', 'vo', 'once', 'rvo'],
    tags: ['tools'],
    command: /^\.?(vv|viewonce|vo|once|rvo)$/i,

    async execute(sock, m) {
        if (!m.quoted) {
            return m.reply('Please reply to a view-once message.');
        }

        const targetMsg = m.quoted;
        const targetId = targetMsg.stanzaId || targetMsg.key?.id;
        const targetParticipant = targetMsg.participant || targetMsg.key?.participant || m.from;

        const vvKey = {
            remoteJid: m.from,
            id: targetId,
            ...(targetParticipant ? { participant: targetParticipant } : {})
        };

        const storedCopy = typeof global.getMessage === 'function'
            ? global.getMessage(vvKey)
            : null;

        const quotedCopy = targetMsg.rawQuotedMessage || targetMsg.message;
        const innerCopy = targetMsg.innerMessage;

        const sources = [
            storedCopy,
            quotedCopy,
            innerCopy
        ].filter(Boolean);

        let downloadedBuffer = null;
        let selectedInfo = null;

        for (const source of sources) {
            const unwrapped = unwrapMessage(source);
            if (!unwrapped.type || !unwrapped.media) continue;

            const media = unwrapped.media;

            try {
                downloadedBuffer = await downloadMediaMessage(
                    {
                        key: vvKey,
                        message: unwrapped.cur
                    },
                    'buffer',
                    {},
                    {
                        reuploadRequest: msg => (sock.updateMediaMessage ? sock.updateMediaMessage(msg) : undefined)
                    }
                );
            } catch {
                if (media.mediaKey && (media.directPath || media.url)) {
                    try {
                        const stream = await downloadContentFromMessage(media, unwrapped.type);
                        const chunks = [];
                        for await (const chunk of stream) chunks.push(chunk);
                        downloadedBuffer = Buffer.concat(chunks);
                    } catch {
                        downloadedBuffer = null;
                    }
                }
            }

            if (Buffer.isBuffer(downloadedBuffer) && downloadedBuffer.length > 0) {
                selectedInfo = unwrapped;
                break;
            }

            downloadedBuffer = null;
        }

        if (!downloadedBuffer || !selectedInfo) {
            return m.reply('Failed to download media.');
        }

        const mediaType = selectedInfo.type;
        const mediaObj = selectedInfo.media;
        const defaultMime = mediaType === 'image'
            ? 'image/jpeg'
            : mediaType === 'video'
                ? 'video/mp4'
                : 'audio/ogg; codecs=opus';

        const mimeType = mediaObj.mimetype || defaultMime;
        const caption = mediaObj.caption ? `${mediaObj.caption}\n\nSaved` : 'Saved';

        try {
            if (mediaType === 'image') {
                await sock.sendMessage(m.from, {
                    image: downloadedBuffer,
                    mimetype: mimeType,
                    caption
                });
            } else if (mediaType === 'video') {
                await sock.sendMessage(m.from, {
                    video: downloadedBuffer,
                    mimetype: mimeType,
                    caption
                });
            } else if (mediaType === 'audio') {
                await sock.sendMessage(m.from, {
                    audio: downloadedBuffer,
                    mimetype: mimeType,
                    ptt: !!mediaObj.ptt
                });
            }
        } catch {
            m.reply('Failed to send media.');
        }
    }
};
