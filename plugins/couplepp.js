const fetch = require('node-fetch');

module.exports = {
    name: 'ppcouple',
    description: 'Sends a random anime couple image',
    aliases: ['ppcp', 'couplepp'],
    tags: ['img'],

    async execute(sock, m) {
        try {
            // reat emoji for this cmd
            await m.react('💑');
            const res = await fetch('https://raw.githubusercontent.com/KazukoGans/database/main/anime/ppcouple.json');
            const data = await res.json();
            const cita = data[Math.floor(Math.random() * data.length)];

            const cowiBuffer = await (await fetch(cita.cowo)).buffer();
            await sock.sendMessage(m.from, { image: cowiBuffer, caption: '> Boy' }, { quoted: m.key ? m : undefined });

            const ciwiBuffer = await (await fetch(cita.cewe)).buffer();
            await sock.sendMessage(m.from, { image: ciwiBuffer, caption: '> Girl' }, { quoted: m.key ? m : undefined });

        } catch (err) {
            console.error('❌ Error sending couple images:', err);
            await sock.sendMessage(m.from, { text: 'Failed to fetch couple images.' }, { quoted: m.key ? m : undefined });
        }
    }
};
