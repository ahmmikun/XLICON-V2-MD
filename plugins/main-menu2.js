module.exports = {
    name: 'menu2',
    description: 'Interactive menu with essential commands',
    aliases: ['test', 'menu2'],

    async execute(sock, m) {
        try {
            const msg = generateWAMessageFromContent(
                m.from,
                {
                    interactiveMessage: {
                        header: {
                            title: 'XLICON v2 ᴍᴜʟᴛɪᴅᴇᴠɪᴄᴇ'
                        },
                        body: {
                            text:
                                `Tap any button below to execute the command instantly:\n\n` +
                                `Current prefix: *${global.BOT_PREFIX}*\n\n` +
                                `> 「 𝙏𝙞𝙢𝙚 - 𝙏𝙞𝙢𝙚𝙡𝙚𝙨𝙨 」`
                        },
                        footer: {
                            text: 'Instant commands • abztech.xyz'
                        },
                        contextInfo: {
                            stanzaId: m.key.id,
                            participant: m.sender,
                            quotedMessage: m.message
                        },
                        nativeFlowMessage: {
                            buttons: [
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
                                    name: 'single_select',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'More',
                                        sections: [
                                            {
                                                title: 'XLICON v2',
                                                rows: [
                                                    {
                                                        header: 'Ping',
                                                        title: 'Check Bot Ping',
                                                        id: `${global.BOT_PREFIX}ping`
                                                    },
                                                    {
                                                        header: 'Menu',
                                                        title: 'Show Menu',
                                                        id: `${global.BOT_PREFIX}menu`
                                                    }
                                                ]
                                            }
                                        ]
                                    })
                                }
                            ],
                            messageParamsJson: JSON.stringify({
                                bottom_sheet: {
                                    in_thread_buttons_limit: 2,
                                    divider_indices: [1],
                                    list_title: 'More Options',
                                    button_title: 'Click Here'
                                }
                            })
                        }
                    }
                },
                {
                    userJid: m.sender,
                    messageId: generateMessageID()
                }
            );

            await sock.relayMessage(
                m.from,
                msg.message,
                {
                    messageId: msg.key.id,
                    additionalNodes: [
                        {
                            tag: 'biz',
                            attrs: {},
                            content: [
                                {
                                    tag: 'interactive',
                                    attrs: {
                                        type: 'native_flow',
                                        v: '1'
                                    },
                                    content: [
                                        {
                                            tag: 'native_flow',
                                            attrs: {
                                                v: '9',
                                                name: 'mixed'
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            );

            await sock.sendMessage(m.from, {
                react: {
                    text: '✅',
                    key: m.key
                }
            });

        } catch (error) {
            console.error('Menu2 plugin error:', error);
            await m.reply(String(error.stack || error));
        }
    }
};
