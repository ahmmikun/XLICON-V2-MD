module.exports = {
    name: 'style',
    description: 'XLICON V2 text styler',
    aliases: ['font', 'textstyle', 'styler'],
    tags: ['main'],

    command: /^(?:\.|\/|!)?\s*style/i,

    async execute(sock, m) {
        try {
            await m.react('💫');

            const messageText = m.body || m.text || '';
            const q = messageText.replace(/^(?:\.|\/|!)?\s*style\s*/i, '').trim();

            const normal = 'abcdefghijklmnopqrstuvwxyz';

            const styles = {
                1: 'ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ',
                2: 'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ',
                3: '𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏',
                4: '𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷',
                5: '𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫',
                6: '🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉',
                7: 'ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖᑫʳˢᵗᵘᵛʷˣʸᶻ',
                8: '🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩',
                9: '🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉',
                10: '𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇',
                11: '𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻',
                12: '𝙖𝙗𝙘𝙙𝙚𝙛𝙜𝙝𝙞𝙟𝙠𝙡𝙢𝙣𝙤𝙥𝙦𝙧𝙨𝙩𝙪𝙫𝙬𝙭𝙮𝙯',
                13: '𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣',
                14: '𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃',
                15: '𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅',
                16: 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ',
                17: 'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ',
                18: 'ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖᑫʳˢᵗᵘᵛʷˣʸᶻ',
                19: 'ₐᵦ𝒸𝒹ₑ𝒻𝓰ₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥ𝓌ₓᵧ𝓏',
                20: 'ąɓƈɗɛʄɠɧıʝƙƖɱŋơ℘զཞʂɬʉ۷ῳჯყʐ'
            };

            const convert = (text, style) => {
                const chars = [...style];

                return [...text].map(char => {
                    const index = normal.indexOf(char.toLowerCase());
                    return index !== -1 && chars[index] ? chars[index] : char;
                }).join('');
            };

            if (!q) {
                const preview = Object.entries(styles)
                    .map(([num, style]) => `${num}. ${convert('XLICON V2', style)}`)
                    .join('\n');

                return await sock.sendMessage(m.from, {
                    text: `*XLICON V2 TEXT STYLER*\n\nExample:\n.style 1,XLICON V2\n\n${preview}`
                });
            }

            const match = q.match(/^(\d+)[,\s]+(.+)$/);

            if (!match) {
                return await sock.sendMessage(m.from, {
                    text: '*Usage:* .style 1,XLICON V2'
                });
            }

            const styleNumber = Number(match[1]);
            const text = match[2];

            if (!styles[styleNumber]) {
                return await sock.sendMessage(m.from, {
                    text: `Style ${styleNumber} not found. Choose 1-${Object.keys(styles).length}.`
                });
            }

            await sock.sendMessage(m.from, {
                text: convert(text, styles[styleNumber])
            });

        } catch (err) {
            console.error('XLICON V2 Style Error:', err);

            await sock.sendMessage(m.from, {
                text: `Error: ${err.message || 'Failed to style text.'}`
            });
        }
    }
};
