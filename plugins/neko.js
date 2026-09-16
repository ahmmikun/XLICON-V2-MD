const fetch = require('node-fetch');

module.exports = {
    name: 'neko',
    description: 'Sends a random anime neko (catgirl) image',
    aliases: ['cat', 'catgirl', 'nekopic'],
    tags: ['img', 'anime'],

    async execute(sock, m) {
        try {
            await m.react('🐱');

            const res = await fetch('https://nekos.best/api/v2/neko');
            
            if (!res.ok) {
                throw new Error(`API responded with status: ${res.status}`);
            }

            const data = await res.json();

            if (data.results && data.results.length > 0) {
                const imageUrl = data.results[0].url;
                
                await m.reply({ 
                    image: { url: imageUrl },
                    caption: `🐱 Neko, Here we go! 😊`
                });

            } else {
                throw new Error('No image found in API response.');
            }

        } catch (err) {
            console.error('❌ Error fetching neko image:', err);
            await m.reply('❌ Failed to fetch neko image. Please try again later.');
        }
    }
};