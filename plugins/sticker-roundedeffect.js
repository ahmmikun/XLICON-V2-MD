const sharp = require('sharp');

module.exports = {
    name: 'sticker',
    aliases: ['s', 'sr', 'stg'],
    description: 'Create rounded stickers with optional effects',

    async execute(sock, m) {
        if (!m.quoted || !m.quoted.isMedia) {
            return m.reply('Reply to an image with .sr');
        }

        try {
            await m.react('🎨');

            const args = (m.text || '').trim().split(/\s+/).slice(1);
            const effect = (args[0] || 'normal').toLowerCase();

            const allowedEffects = [
                'normal',
                'none',
                'red',
                'blue',
                'green',
                'purple',
                'yellow',
                'cyan',
                'pink',
                'grayscale',
                'grey',
                'sepia',
                'vintage',
                'invert',
                'bright',
                'dark'
            ];

            if (!allowedEffects.includes(effect)) {
                return m.reply(
                    `Unknown effect: ${effect}\n\n` +
                    `Available:\n` +
                    `.sr\n` +
                    `.sr red\n` +
                    `.sr blue\n` +
                    `.sr green\n` +
                    `.sr purple\n` +
                    `.sr yellow\n` +
                    `.sr cyan\n` +
                    `.sr pink\n` +
                    `.sr grayscale\n` +
                    `.sr sepia\n` +
                    `.sr vintage\n` +
                    `.sr invert\n` +
                    `.sr bright\n` +
                    `.sr dark`
                );
            }

            const input = await m.quoted.download();

            let image = sharp(input).ensureAlpha();

            if (effect === 'grayscale' || effect === 'grey') {
                image = image.grayscale();
            }

            if (effect === 'sepia' || effect === 'vintage') {
                image = image.recomb([
                    [0.393, 0.769, 0.189],
                    [0.349, 0.686, 0.168],
                    [0.272, 0.534, 0.131]
                ]);
            }

            if (effect === 'invert') {
                image = image.negate({
                    alpha: false
                });
            }

            if (effect === 'bright') {
                image = image.modulate({
                    brightness: 1.3
                });
            }

            if (effect === 'dark') {
                image = image.modulate({
                    brightness: 0.7
                });
            }

            if (
                effect === 'red' ||
                effect === 'blue' ||
                effect === 'green' ||
                effect === 'purple' ||
                effect === 'yellow' ||
                effect === 'cyan' ||
                effect === 'pink'
            ) {
                const { data, info } = await image
                    .raw()
                    .toBuffer({ resolveWithObject: true });

                const { width, height, channels } = info;

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const i = (y * width + x) * channels;

                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];

                        if (effect === 'red') {
                            data[i] = Math.min(255, r * 1.35);
                            data[i + 1] = Math.round(g * 0.45);
                            data[i + 2] = Math.round(b * 0.45);
                        }

                        if (effect === 'blue') {
                            data[i] = Math.round(r * 0.45);
                            data[i + 1] = Math.round(g * 0.55);
                            data[i + 2] = Math.min(255, b * 1.35);
                        }

                        if (effect === 'green') {
                            data[i] = Math.round(r * 0.45);
                            data[i + 1] = Math.min(255, g * 1.35);
                            data[i + 2] = Math.round(b * 0.45);
                        }

                        if (effect === 'purple') {
                            data[i] = Math.min(255, r * 1.2);
                            data[i + 1] = Math.round(g * 0.4);
                            data[i + 2] = Math.min(255, b * 1.2);
                        }

                        if (effect === 'yellow') {
                            data[i] = Math.min(255, r * 1.2);
                            data[i + 1] = Math.min(255, g * 1.15);
                            data[i + 2] = Math.round(b * 0.35);
                        }

                        if (effect === 'cyan') {
                            data[i] = Math.round(r * 0.35);
                            data[i + 1] = Math.min(255, g * 1.2);
                            data[i + 2] = Math.min(255, b * 1.2);
                        }

                        if (effect === 'pink') {
                            data[i] = Math.min(255, r * 1.3);
                            data[i + 1] = Math.round(g * 0.4);
                            data[i + 2] = Math.min(255, b * 1.15);
                        }
                    }
                }

                image = sharp(data, {
                    raw: {
                        width,
                        height,
                        channels
                    }
                });
            }

            const { data, info } = await image
                .ensureAlpha()
                .raw()
                .toBuffer({ resolveWithObject: true });

            const { width: w, height: h, channels } = info;

            const radius = Math.min(w, h) * 0.08;

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const i = (y * w + x) * channels;

                    let cornerX;
                    let cornerY;
                    let inCorner = false;

                    if (x < radius && y < radius) {
                        cornerX = radius;
                        cornerY = radius;
                        inCorner = true;
                    } else if (x >= w - radius && y < radius) {
                        cornerX = w - radius;
                        cornerY = radius;
                        inCorner = true;
                    } else if (x < radius && y >= h - radius) {
                        cornerX = radius;
                        cornerY = h - radius;
                        inCorner = true;
                    } else if (x >= w - radius && y >= h - radius) {
                        cornerX = w - radius;
                        cornerY = h - radius;
                        inCorner = true;
                    }

                    if (inCorner) {
                        const distance = Math.sqrt(
                            Math.pow(x - cornerX, 2) +
                            Math.pow(y - cornerY, 2)
                        );

                        if (distance > radius) {
                            data[i + 3] = 0;
                        }
                    }
                }
            }

            const stickerBuffer = await sharp(data, {
                raw: {
                    width: w,
                    height: h,
                    channels: 4
                }
            })
                .resize(512, 512, {
                    fit: 'contain',
                    background: {
                        r: 0,
                        g: 0,
                        b: 0,
                        alpha: 0
                    }
                })
                .webp({
                    quality: 90
                })
                .toBuffer();

            await m.reply({
                sticker: stickerBuffer
            });

            await m.react('✅');

        } catch (err) {
            console.error('sticker error:', err);
            await m.reply('Failed to create sticker.');
        }
    }
};
