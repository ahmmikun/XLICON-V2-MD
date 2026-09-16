const axios = require('axios');

module.exports = {
    name: 'guide',
    description: 'Show complete bot guide with all features and usage',
    aliases: ['tutorial', 'howto'],
    tags: ['main'],
    command: /^\.?(guide|help|tutorial|howto)$/i,

    async execute(sock, m, args) {
        await m.react('📖');
        const prefix = global.BOT_PREFIX || '.';

        const guideText = `
┌─ム *XLICON V2 ᴍᴜʟᴛɪᴅᴇᴠɪᴄᴇ ɢᴜɪᴅᴇ*
╰──────────────────╯

👋 *Welcome!* This bot can do a lot!
Below is everything you need to know.

━━━━━━━━━━━━━━━━━━━━━━
📁 *DOWNLOADERS*
━━━━━━━━━━━━━━━━━━━━━━
> *TikTok (no watermark)*
  ${prefix}tiktok or ${prefix}tt <url>
  Example: ${prefix}tiktok https://vt.tiktok.com/xxx

> *YouTube Audio*
  ${prefix}ytmp3 <url or search>
  Example: ${prefix}ytmp3 lofi hip hop

> *YouTube Video*
  ${prefix}ytmp4 <url or search>
  Example: ${prefix}ytmp4 never gonna give you up

> *YouTube Search + Download*
  ${prefix}play <query>
  → Shows buttons to pick MP3 or MP4

> *Instagram Download*
  ${prefix}ig <instagram url>
  Example: ${prefix}ig https://www.instagram.com/reel/xxx

━━━━━━━━━━━━━━━━━━━━━━
🤖 *AI FEATURES*
━━━━━━━━━━━━━━━━━━━━━━
> *Ask AI a question*
  ${prefix}ai <your question>
  Example: ${prefix}ai What is quantum computing?

> *AI Search*
  ${prefix}ai-search <query>
  Example: ${prefix}ai-search latest news

> *AI Voice (audio response)*
  ${prefix}aiv <question>
  → AI answers with a voice message

> *AI Image Generation*
  ${prefix}gen <prompt>
  → Generates an image based on your description

━━━━━━━━━━━━━━━━━━━━━━
🔧 *TOOLS*
━━━━━━━━━━━━━━━━━━━━━━
> *Image → Sticker*
  ${prefix}sticker
  → Reply to an image with this command
  Custom pack/author: ${prefix}sticker PackName | Author

> *OCR (Read text from image)*
  ${prefix}ocr
  → Reply to an image to extract text

> *Text to Speech*
  ${prefix}tts [lang] <text>
  Example: ${prefix}tts Hello world or ${prefix}tts id Halo dunia

> *Text Effects (13 styles)*
  ${prefix}textpro <style> | <text>
  Styles: neon, glitter, fire, shadow, gradient,
  dropwater, cloud, pixel, underwater, summer,
  thunder, pencil, leaves
  Example: ${prefix}textpro neon | XLICON

> *Music Identification*
  ${prefix}shazam
  → Reply to audio/video to identify the song

> *Create Poll*
  ${prefix}poll Question;Option1;Option2

> *Search Images*
  ${prefix}img <query> [count]
  Example: ${prefix}img anime 3

> *Resize Image*
  ${prefix}resize <width> <height>
  → Reply to an image first

> *Upload to URL*
  ${prefix}tourl
  → Reply to any media to get a download link

> *Save View-Once*
  ${prefix}viewonce
  → Reply to a view-once message

> *Create File*
  ${prefix}write <text> txt
  ${prefix}write <text> docx

> *Get Profile Picture*
  ${prefix}pp
  → Reply to a message or use on yourself

━━━━━━━━━━━━━━━━━━━━━━
🌸 *ANIME*
━━━━━━━━━━━━━━━━━━━━━━
> *Random Anime Images*
  ${prefix}waifu
  → Sends a random anime waifu image

  ${prefix}neko
  → Sends a random anime neko (catgirl) image

  ${prefix}kitsune
  → Sends a random anime kitsune (fox) image

  ${prefix}husbando
  → Sends a random anime husbando image

  ${prefix}couplepp
  → Random anime couple profile pictures

━━━━━━━━━━━━━━━━━━━━━━
🎮 *FUN & SEARCH*
━━━━━━━━━━━━━━━━━━━━━━
> *Fun Commands*
  ${prefix}blue / ${prefix}flag
  ${prefix}hide / ${prefix}style
  ${prefix}guessgender / ${prefix}agecalculator

> *Search*
  ${prefix}weather <city>
  → Get current weather information

━━━━━━━━━━━━━━━━━━━━━━
👥 *GROUP & ADMIN*
━━━━━━━━━━━━━━━━━━━━━━
> *Tagging*
  ${prefix}tagme — Tag yourself
  ${prefix}tagall / ${prefix}tagall1 — Tag everyone in the group

> *Management*
  ${prefix}group — Open/close group settings
  ${prefix}ginfo <invite link> — Get group info
  ${prefix}antigst — Anti-group link/sticker protection
  ${prefix}kick / ${prefix}promote / ${prefix}demote — Admin actions

━━━━━━━━━━━━━━━━━━━━━━
📊 *STATUS & CHANNEL*
━━━━━━━━━━━━━━━━━━━━━━
> ${prefix}gstatus — Check group status
> ${prefix}channelid — Get channel ID info

━━━━━━━━━━━━━━━━━━━━━━
📌 *GENERAL*
━━━━━━━━━━━━━━━━━━━━━━
> ${prefix}alive — Check if bot is online
> ${prefix}ping — Check bot speed
> ${prefix}uptime — Check bot uptime
> ${prefix}owner — Contact bot owner
> ${prefix}menu2 — Show alternative menu style

━━━━━━━━━━━━━━━━━━━━━━
💡 *TIPS*
━━━━━━━━━━━━━━━━━━━━━━
• Most commands work by *replying* to a message
• Downloaders accept both *URLs* and *search queries*
• Use ${prefix}play for the best YouTube experience
  (lets you choose MP3 or MP4)
• AI commands are available to everyone
• Self mode restricts bot to owner only

> 「 𝙏𝙞𝙢𝙚 - 𝙏𝙞𝙢𝙚𝙡𝙚𝙨𝙈 」
`.trim();

        try {
            const imageBuffer = (await axios.get(global.menuImage, {
                responseType: 'arraybuffer'
            })).data;

            await m.reply(imageBuffer, {
                caption: guideText
            });

        } catch (err) {
            console.error('Guide error:', err);
            await m.reply(guideText);
        }
    }
};