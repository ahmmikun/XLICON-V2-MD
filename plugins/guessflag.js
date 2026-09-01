const axios = require('axios');

const games = new Map();

module.exports = {
    name: 'game',
    aliases: ['guessflag'],
    description: 'Guess the country from its flag',

    async execute(sock, m) {
        const chatId = m.key.remoteJid;

        if (games.has(chatId)) {
            await m.reply('There is already a flag game running in this chat.');
            return;
        }

        try {
            const response = await axios.get(
                'https://api-abztech.zone.id/search/countries',
                { timeout: 30000 }
            );

            const countries = response.data?.countries;

            if (!Array.isArray(countries) || !countries.length) {
                await m.reply('Failed to load countries.');
                return;
            }

            const country = countries[Math.floor(Math.random() * countries.length)];

            const imageResponse = await axios.get(country.img, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            const image = Buffer.from(imageResponse.data);

            const gameMessage = await sock.sendMessage(chatId, {
                image,
                caption:
                    `╭─〔 GUESS THE FLAG 〕\n` +
                    `│\n` +
                    `│ Reply to this message\n` +
                    `│ with the correct country.\n` +
                    `│\n` +
                    `│ You have 1 minute.\n` +
                    `│ Type .hintflag for a hint.\n` +
                    `│\n` +
                    `╰────────────────`
            });

            const sender = m.key.participant || m.key.remoteJid;

            games.set(chatId, {
                answer: country.name,
                sender,
                messageId: gameMessage.key.id,
                hintUsed: false,
                timeout: setTimeout(async () => {
                    const game = games.get(chatId);

                    if (!game) return;

                    games.delete(chatId);

                    await sock.sendMessage(chatId, {
                        text: `⏰ Time's up!\n\nThe correct answer was: ${game.answer}`
                    });
                }, 60000)
            });

        } catch (err) {
            console.error('game error:', err);
            await m.reply('Failed to start the flag game.');
        }
    },

    async onMessage(sock, m) {
        const chatId = m.key.remoteJid;
        const game = games.get(chatId);

        if (!game || !m.text) return;

        const sender = m.key.participant || m.key.remoteJid;

        if (sender !== game.sender) return;

        const text = m.text.trim();

        if (text.toLowerCase() === '.hintflag') {
            if (game.hintUsed) {
                await m.reply('You already used the hint.');
                return;
            }

            game.hintUsed = true;

            const answer = game.answer;
            const firstLetter = answer.charAt(0).toUpperCase();
            const letters = answer.length;

            await m.reply(
                `Hint:\n\n` +
                `Starts with: ${firstLetter}\n` +
                `Letters: ${letters}`
            );

            return;
        }

        if (text.startsWith('.')) return;

        if (!m.quoted) return;

        const quotedId = m.quoted.key?.id;

        if (quotedId !== game.messageId) return;

        if (text.toLowerCase() === game.answer.toLowerCase()) {
            clearTimeout(game.timeout);
            games.delete(chatId);

            await m.reply(
                `Correct!\n\n` +
                `The answer was ${game.answer}.`
            );
        } else {
            await m.reply('Wrong answer. Try again.');
        }
    }
};
