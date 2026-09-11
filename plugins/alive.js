const sharp = require('sharp');

module.exports = {
    name: 'alive',
    description: 'Check if the bot is alive',
    aliases: [],
    tags: ['main'],
    command: /^(alive)$/i,

    async execute(sock, m) {
        try {
            
      
            await m.react('⚡');
            const width = 300;
            const height = 300;

            const imageResponse = await fetch('https://i.ibb.co/BVmdwyv8/IMG-20260417-WA0030.jpg');
            const imageBuffer = await imageResponse.arrayBuffer();

            const thumb = await sharp(Buffer.from(imageBuffer))
                .resize(width, height)
                .jpeg({ quality: 40 })
                .toBuffer();

            const audioUrl = 'https://eliteprotech-url.zone.id/1787244048021ghdr1r.mp3';
            const audioResponse = await fetch(audioUrl);
            const audioBuffer = await audioResponse.arrayBuffer();

            const fakeQuoted = {
                key: {
                    remoteJid: m.from,
                    fromMe: false,
                    participant: m.sender,
                    id: 'fakeid123'
                },
                message: {
                    imageMessage: {
                        mimetype: 'image/jpeg',
                        jpegThumbnail: thumb,
                        caption: 'i am alive'
                    }
                }
            };

            await sock.sendMessage(m.from, {
                audio: Buffer.from(audioBuffer),
                mimetype: 'audio/mp4',
                ptt: false
            }, { quoted: fakeQuoted });

        } catch (err) {
            console.error('❌ Alive plugin error:', err);
        }
    },
};
