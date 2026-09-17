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

            if (isNaN(count)) {
                count = 1;
            }

            if (count > 5) {
                count = 5;
            }

            if (count < 1) {
                count = 1;
            }

            if (!isNaN(parseInt(args[args.length - 1]))) {
                args.pop();
            }

            const query = args.join(' ');

            const url =
                `https://ab-pinetrest.abrahamdw882.workers.dev/?query=${encodeURIComponent(query)}`;

            const res = await axios.get(url, {
                timeout: 15000
            });

            if (
                !res.data?.status ||
                !Array.isArray(res.data.data) ||
                !res.data.data.length
            ) {
                return m.reply('No images found.');
            }

            const images = res.data.data.slice(0, count);

            const validImages = [];

            for (const item of images) {
                const imageUrl =
                    item.url ||
                    item.image ||
                    item.src ||
                    item.imageUrl;

                if (!imageUrl) continue;

                try {
                    const response = await axios.get(imageUrl, {
                        responseType: 'arraybuffer',
                        timeout: 15000
                    });

                    validImages.push({
                        buffer: Buffer.from(response.data),
                        url: imageUrl
                    });
                } catch (err) {
                    console.log('Image download failed:', err.message);
                }
            }

            if (!validImages.length) {
                return m.reply('Could not load any images.');
            }

            if (validImages.length === 1) {
                await sock.sendMessage(
                    m.from,
                    {
                        image: validImages[0].buffer,
                        caption: `🌄 *${query}*`
                    },
                    {
                        quoted: m
                    }
                );

                await m.react('✅');
                return;
            }

            const cards = [];

            for (let i = 0; i < validImages.length; i++) {
                const imageMessage = (
                    await generateWAMessageContent(
                        {
                            image: validImages[i].buffer
                        },
                        {
                            upload: sock.waUploadToServer
                        }
                    )
                ).imageMessage;

                cards.push({
                    header: {
                        title: `Image ${i + 1}`,
                        subtitle: query,
                        imageMessage,
                        hasMediaAttachment: true
                    },
                    body: {
                        text: `Result ${i + 1} for "${query}"`
                    },
                    footer: {
                        text: 'abztech'
                    },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({
                                    display_text: 'Test',
                                    id: `img_${i}_${Date.now()}`
                                })
                            }
                        ],
                        messageParamsJson: '{}'
                    }
                });
            }

            const msg = generateWAMessageFromContent(
                m.from,
                {
                    interactiveMessage: {
                        header: {
                            hasMediaAttachment: false
                        },
                        body: {
                            text:
                                `🌄 *IMAGE SEARCH*\n\n` +
                                `🔎 Query: *${query}*\n` +
                                `🖼️ Results: *${cards.length}*\n\n` +
                                `Swipe to browse`
                        },
                        footer: {
                            text: 'abztech'
                        },
                        carouselMessage: {
                            cards
                        },
                        contextInfo: {}
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

            await m.react('✅');

        } catch (error) {
            console.error('IMG command error:', error);
            await m.react('❌');
            return m.reply(`Failed to search images.\n\n${error.message}`);
        }
    }
};
