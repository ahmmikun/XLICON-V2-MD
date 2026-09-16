const fetch = require('node-fetch');

module.exports = {
    name: 'waifu',
    description: 'Sends a random anime waifu image',
    aliases: ['anime', 'animepic', 'waifupic'],
    tags: ['img', 'anime'],

    async execute(sock, m) {
        try {
            // 1. Use your built-in m.react() helper (much cleaner!)
            await m.react('💖');

            // 2. Fetch from Nekos.best API
            const res = await fetch('https://nekos.best/api/v2/waifu');
            
            if (!res.ok) {
                throw new Error(`API responded with status: ${res.status}`);
            }

            const data = await res.json();

            // 3. Extract data safely
            if (data.results && data.results.length > 0) {
                const imageUrl = data.results[0].url;
                

                // 4. Use your built-in m.reply() helper! 
                // It automatically handles the 'quoted: m' part for you.
                await m.reply({ 
                    image: { url: imageUrl },
                    caption: `💖 Waifu, Here we go! 😊`
                });

            } else {
                throw new Error('No image found in API response.');
            }

        } catch (err) {
            console.error('❌ Error fetching waifu image:', err);
            
            // Use m.reply for error messages too
            await m.reply('❌ Failed to fetch anime image. Please try again later.');
        }
    }
};