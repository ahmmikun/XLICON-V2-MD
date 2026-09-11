const axios = require('axios');

module.exports = {
    name: 'img',
    description: 'Search and send images',
    aliases: ['image', 'pic'],
    tags: ['tools'],
    command: /^\.?(img|image|pic)/i,

    async execute(sock, m, args) {
        try {
            
            await m.react('🌄');

            if (!args[0]) {
                return m.reply('Usage: .img <query> [count]');
            }

            let count = parseInt(args[args.length - 1]);
            if (isNaN(count)) count = 1;
            if (count > 5) count = 5;

            if (!isNaN(parseInt(args[args.length - 1]))) {
                args.pop();
            }

            const query = args.join(' ');
            const url = `https://ab-pinetrest.abrahamdw882.workers.dev/?query=${encodeURIComponent(query)}`;

            const res = await axios.get(url);
            if (!res.data?.status || !res.data.data.length) {
                return m.reply('No images found.');
            }

            const images = res.data.data.slice(0, count);

            if (images.length === 1) {
                await m.reply(`Here is a ${query}`);
            } else {
                await m.reply(`Here are ${images.length} ${query}s`);
            }

            for (const img of images) {
                await sock.sendMessage(m.from, {
                    image: { url: img.image }
                });
            }

        } catch (err) {
            m.reply('Failed to fetch images.');
        }
    }
};
