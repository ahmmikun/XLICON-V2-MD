const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'save',
    aliases: ['savefile', 'download'],
    description: 'Save media from quoted message (Owner only)',

    async execute(sock, m, args) {
        const normalize = jid => jid?.split(':')[0].split('@')[0];

        const sender = normalize(m.sender);
        const botId = normalize(sock.user.id);
        const owners = (global.owners || []).map(normalize);

        const isOwner = owners.includes(sender) || sender === botId;

        if (!isOwner || !m.quoted) return;

        try {
            let msg = m.quoted.message;

            while (true) {
                if (msg?.groupStatusMessageV2) {
                    msg = msg.groupStatusMessageV2.message;
                } else if (msg?.ephemeralMessage) {
                    msg = msg.ephemeralMessage.message;
                } else if (msg?.viewOnceMessage) {
                    msg = msg.viewOnceMessage.message;
                } else if (msg?.viewOnceMessageV2) {
                    msg = msg.viewOnceMessageV2.message;
                } else if (msg?.message) {
                    msg = msg.message;
                } else {
                    break;
                }
            }

            const mediaTypes = [
                'imageMessage',
                'videoMessage',
                'audioMessage',
                'documentMessage',
                'stickerMessage'
            ];

            const mediaType = mediaTypes.find(type => msg?.[type]);

            if (!mediaType) return;

            const buffer = await downloadMediaMessage(
                { message: msg },
                'buffer',
                {},
                { logger: console }
            );

            const mediaData = msg[mediaType];
            const mimetype = mediaData.mimetype || '';

            const destination = sender === botId
                ? sock.user.id
                : m.sender;

            if (mediaType === 'imageMessage') {
                await sock.sendMessage(destination, { image: buffer });
            } else if (mediaType === 'videoMessage') {
                await sock.sendMessage(destination, { video: buffer, mimetype });
            } else if (mediaType === 'audioMessage') {
                await sock.sendMessage(destination, {
                    audio: buffer,
                    mimetype,
                    ptt: mediaData.ptt || false
                });
            } else if (mediaType === 'documentMessage') {
                await sock.sendMessage(destination, {
                    document: buffer,
                    mimetype,
                    fileName: mediaData.fileName || 'document'
                });
            } else if (mediaType === 'stickerMessage') {
                await sock.sendMessage(destination, { sticker: buffer });
            }

        } catch (err) {
            console.error('save command error:', err);
        }
    }
};
