const { sendInteractiveMessage } = require('gifted-btns');

module.exports = {
    name: 'menu2',
    description: 'Interactive menu with essential commands',
    aliases: ['test', 'menu2'],

    async execute(sock, m) {
        try {
             // reat emoji for this cmd
            await m.react('💯');
            await sendInteractiveMessage(sock, m.from, {
                title: 'XLICON v2 ᴍᴜʟᴛɪᴅᴇᴠɪᴄᴇ',
                text: `Tap any button below to execute the command instantly:\n\n` +
                      `Current prefix: *${global.BOT_PREFIX}*\n\n` +
                      '> 「 𝙏𝙞𝙢𝙚 - 𝙏𝙞𝙢𝙚𝙡𝙚𝙨𝙨 」',
                footer: 'Instant commands • https://abztech.xyz',
                interactiveButtons: [
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({ 
                            display_text: 'Owner', 
                            id: `${global.BOT_PREFIX}owner` 
                        })
                    },
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({ 
                            display_text: 'Alive', 
                            id: `${global.BOT_PREFIX}alive` 
                        })
                    },
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({ 
                            display_text: 'Uptime', 
                            id: `${global.BOT_PREFIX}uptime` 
                        })
                    },
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({ 
                            display_text: 'Ping', 
                            id: `${global.BOT_PREFIX}ping` 
                        })
                    }
                ]
            });
        } catch (error) {
            console.error('Menu2 plugin error:', error);
            await m.reply('Failed to load interactive menu.');
        }
    }
};
