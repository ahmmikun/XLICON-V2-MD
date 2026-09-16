const fetch = require('node-fetch');

module.exports = {
    name: 'kitsune',
    description: 'Sends a random anime kitsune (fox) image',
    aliases: ['fox', 'foxgirl', 'kitsunepic'],
    tags: ['img', 'anime'],

    async execute(sock, m) {
        try {
            await m.react('🦊');

            const res = await fetch('https://nekos.best/api/v2/kitsune');
            
            if (!res.ok) {
                throw new Error(`API responded with status: ${res.status}`);
            }

            const data = await res.json();

            if (data.results && data.results.length > 0) {
                const imageUrl = data.results[0].url;
                
                await m.reply({ 
                    image: { url: imageUrl },
                    caption: `🦊 Kitsune, Here we go! 😊`
                });

            } else {
                throw new Error('No image found in API response.');
            }

        } catch (err) {
            console.error('❌ Error fetching kitsune image:', err);
            await m.reply('❌ Failed to fetch kitsune image. Please try again later.');
        }
    }
};