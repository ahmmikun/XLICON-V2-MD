const googleTTS = require('google-tts-api');
const axios = require('axios');

const DEFAULT_LANG = 'en';

// Common ISO 639-1 language codes supported by Google TTS
const SUPPORTED_LANGS = new Set([
    'af', 'sq', 'ar', 'hy', 'bn', 'bs', 'ca', 'hr', 'cs', 'da', 'nl', 'en', 'eo',
    'et', 'tl', 'fi', 'fr', 'de', 'el', 'gu', 'hi', 'hu', 'is', 'id', 'it', 'ja',
    'jw', 'kn', 'km', 'ko', 'la', 'lv', 'mk', 'ml', 'mr', 'my', 'ne', 'no', 'pl',
    'pt', 'ro', 'ru', 'sr', 'si', 'sk', 'sq', 'es', 'su', 'sw', 'sv', 'ta', 'te',
    'th', 'tr', 'uk', 'ur', 'vi', 'cy', 'zh', 'zh-cn', 'zh-tw'
]);

async function getTTSBuffer(text, lang = 'en') {
    // Primary method: google-tts-api (handles long text, robust chunks, converts directly to Base64/Buffer)
    try {
        const audioChunks = await googleTTS.getAllAudioBase64(text, {
            lang: lang,
            slow: false,
            timeout: 10000,
            splitPunct: ',.?!'
        });
        if (audioChunks && audioChunks.length > 0) {
            return Buffer.concat(audioChunks.map(chunk => Buffer.from(chunk.base64, 'base64')));
        }
    } catch (err) {
        console.warn('google-tts-api getAllAudioBase64 error:', err.message);
    }

    // Fallback 1: Direct Google Translate TTS endpoint
    try {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.slice(0, 200))}&tl=${encodeURIComponent(lang)}&client=tw-ob`;
        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (res.data) {
            return Buffer.from(res.data);
        }
    } catch (err) {
        console.warn('Google Translate TTS fallback error:', err.message);
    }

    // Fallback 2: Third-party worker API
    try {
        const response = await axios.get(
            `https://ab-text-voice.abrahamdw882.workers.dev/?q=${encodeURIComponent(text)}&voicename=jane`,
            { timeout: 10000 }
        );
        if (response.data && response.data.url) {
            const audioRes = await axios.get(response.data.url, {
                responseType: 'arraybuffer',
                timeout: 15000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            return Buffer.from(audioRes.data);
        }
    } catch (err) {
        console.warn('Worker TTS fallback error:', err.message);
    }

    throw new Error('All TTS providers failed to generate audio buffer');
}

module.exports = {
    name: 'tts2',
    description: 'Convert text to speech (supports multiple languages and Termux/Android)',
    aliases: ['say', 'speak', 'audio'],
    tags: ['main', 'tools'],
    command: /^\.?(say|speak|audio)/i,

    async execute(sock, m, args = []) {
        try {
            let lang = DEFAULT_LANG;
            let text = '';

            const input = (args || []).join(' ').trim();
            const quotedText = m.quoted?.text || m.quoted?.body || '';

            if (input) {
                const parts = input.split(/\s+/);
                const possibleLang = parts[0].toLowerCase();

                if (SUPPORTED_LANGS.has(possibleLang) && parts.length > 1) {
                    lang = possibleLang;
                    text = parts.slice(1).join(' ').trim();
                } else if (SUPPORTED_LANGS.has(possibleLang) && parts.length === 1 && quotedText) {
                    lang = possibleLang;
                    text = quotedText.trim();
                } else {
                    text = input;
                }
            } else if (quotedText) {
                text = quotedText.trim();
            }

            if (!text) {
                const prefix = global.BOT_PREFIX || '.';
                return m.reply(
                    `*Text to Speech (TTS)*\n\n` +
                    `*Usage:*\n` +
                    `• ${prefix}tts <text>\n` +
                    `• ${prefix}tts <lang_code> <text>\n` +
                    `• Reply to a text message with ${prefix}tts [lang_code]\n\n` +
                    `*Examples:*\n` +
                    `• ${prefix}tts Hello world\n` +
                    `• ${prefix}tts id Halo apa kabar\n` +
                    `• ${prefix}tts es Buenos dias\n` +
                    `• ${prefix}tts ar مرحبا بكم`
                );
            }

            const buffer = await getTTSBuffer(text, lang);

            const name = m.pushName || (m.sender ? m.sender.split('@')[0] : 'User');
            const quoted = {
                key: {
                    fromMe: false,
                    participant: m.sender,
                    ...(m.isGroup ? { remoteJid: m.from } : {}),
                },
                message: {
                    contactMessage: {
                        displayName: name,
                        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;a,;;;\nFN:${name}\nitem1.TEL;waid=${(m.sender || '').split('@')[0]}:${(m.sender || '').split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
                    },
                },
            };

            await sock.sendMessage(
                m.from,
                {
                    audio: buffer,
                    mimetype: 'audio/mpeg',
                    ptt: true,
                    fileName: 'TTS.mp3',
                    contextInfo: {
                        mentionedJid: [m.sender]
                    },
                },
                { quoted }
            );
        } catch (err) {
            console.error('TTS plugin error:', err);
            m.reply('❌ Failed to generate TTS. Please try again.');
        }
    },
};
