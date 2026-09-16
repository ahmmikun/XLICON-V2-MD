const fetch = require('node-fetch');

module.exports = {
    name: 'husbando',
    description: 'Sends a random anime husbando image',
    aliases: ['husbandopic', 'animeboy'],
    tags: ['img', 'anime'],

    async execute(sock, m) {
        try {
            await m.react('💙');

            const res = await fetch('https://nekos.best/api/v2/husbando');
            
            if (!res.ok) {
                throw new Error(`API responded with status: ${res.status}`);
            }

            const data = await res.json();

            if (data.results && data.results.length > 0) {
                const imageUrl = data.results[0].url;
                
                await m.reply({ 
                    image: { url: imageUrl },
                    caption: `💙 Husbando, Here we go! 😊`
                });

            } else {
                throw new Error('No image found in API response.');
            }

        } catch (err) {
            console.error('❌ Error fetching husbando image:', err);
            await m.reply('❌ Failed to fetch husbando image. Please try again later.');
        }
    }
};