const axios = require('axios');
const sharp = require('sharp');

module.exports = {
    name: 'resize',
    description: 'Resize image to specified resolution',
    aliases: ['imgresize', 'resizeimg'],
    tags: ['tools'],
    command: /^.?(resize|imgresize|resizeimg)/i,

    async execute(sock, m, args) {
       
            
        await m.react('✂️');
        const chatId = m.key.remoteJid;

        const quoted = m.quoted;
        if (!quoted || !quoted.message || !quoted.message.imageMessage) {
            return m.reply("Please reply to an image with:\n.resize <width> <height>\nExample: .resize 1920 1080");
        }

        const width = parseInt(args[0]);
        const height = parseInt(args[1]);

        if (!width || !height || isNaN(width) || isNaN(height) || width < 1 || height < 1) {
            return m.reply("Invalid dimensions. Usage:\n.resize <width> <height>\nExample: .resize 1920 1080");
        }

        try {
            await sock.sendMessage(chatId, {
                react: { text: '🖼️', key: m.key }
            });

            const imageBuffer = await m.quoted.download();

            const resizedBuffer = await sharp(imageBuffer)
                .resize(width, height, {
                    fit: 'cover',
                    position: 'center'
                })
                .toBuffer();

            await sock.sendMessage(chatId, {
                image: resizedBuffer,
                caption: `Resized to ${width}x${height}`
            });

        } catch (err) {
            console.error('Resize error:', err.message);
            m.reply('Failed to resize image. Make sure it\'s a valid image.');
        }
    }
};
