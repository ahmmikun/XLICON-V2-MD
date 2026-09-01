const axios = require('axios');

const games = new Map();
const processedMessages = new Set();

module.exports = {
    name: 'flag',
    aliases: ['guessflag'],
    description: 'Guess the country from its flag',

    async execute(sock, m) {
        const chatId = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        const playerName = m.pushName || m.sender?.split('@')[0] || 'Player';

        if (games.has(chatId)) {
            await m.reply('There is already a flag game running in this chat.');
            return;
        }

        try {
            const response = await axios.get(
                'https://api-abztech.zone.id/search/countries',
                {
                    timeout: 30000
                }
            );

            const countries = response.data?.countries;

            if (!Array.isArray(countries) || !countries.length) {
                await m.reply('Failed to load countries.');
                return;
            }

            const country = countries[
                Math.floor(Math.random() * countries.length)
            ];

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
                    `│ Player: ${playerName}\n` +
                    `│\n` +
                    `│ Reply to this flag\n` +
                    `│ with the country name.\n` +
                    `│\n` +
                    `│ You have 1 minute.\n` +
                    `│ Type .hintflag for a hint.\n` +
                    `│\n` +
                    `╰────────────────`
            });

            const timeout = setTimeout(async () => {
                const game = games.get(chatId);

                if (!game) return;

                games.delete(chatId);

                await sock.sendMessage(chatId, {
                    text:
                        `⏰ Time's up, ${game.playerName}!\n\n` +
                        `The correct answer was: ${game.answer}`
                });
            }, 60000);

            games.set(chatId, {
                answer: country.name,
                sender,
                playerName,
                messageId: gameMessage.key.id,
                hintUsed: false,
                timeout
            });

        } catch (err) {
            console.error('game error:', err);
            await m.reply('Failed to start the flag game.');
        }
    },

    async onMessage(sock, m) {
        if (!m.text) return;

        const messageId = m.key?.id;

        if (!messageId) return;

        if (processedMessages.has(messageId)) return;

        processedMessages.add(messageId);

        setTimeout(() => {
            processedMessages.delete(messageId);
        }, 120000);

        const chatId = m.key.remoteJid;
        const game = games.get(chatId);

        if (!game) return;

        const sender = m.key.participant || m.key.remoteJid;
        const playerName = m.pushName || m.sender?.split('@')[0] || 'Player';
        const text = m.text.trim();

        if (sender !== game.sender) return;

        if (text.toLowerCase() === '.hintflag') {
            if (game.hintUsed) return;

            game.hintUsed = true;

            const answer = game.answer;

            await m.reply(
                `Hint for ${game.playerName}\n\n` +
                `Starts with: ${answer.charAt(0).toUpperCase()}\n` +
                `Letters: ${answer.length}`
            );

            return;
        }

        if (!m.quoted) return;

        const quotedId = m.quoted.key?.id;

        if (quotedId !== game.messageId) return;

        if (text.toLowerCase() === game.answer.toLowerCase()) {
            clearTimeout(game.timeout);
            games.delete(chatId);

            await m.reply(
                `Correct, ${playerName}!\n\n` +
                `The answer was ${game.answer}.`
            );
        } else {
            await m.reply(
                `Wrong answer, ${playerName}!\n\n` +
                `Try again.`
            );
        }
    }
};
