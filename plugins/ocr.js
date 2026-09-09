const axios = require('axios')
const FormData = require('form-data')
const { sendInteractiveMessage } = require('gifted-btns')

module.exports = {
  name: 'ocr',
  description: 'Extract text from an image',
  aliases: ['readtext'],
  tags: ['tools'],
  command: /^\.?(ocr|readtext)$/i,

  async execute(sock, m) {
    try {
       // reat emoji for this cmd
            
        await m.react('🔍');
      if (!m.quoted) return m.reply('Reply to an image to extract text.')
      if (!m.quoted.message?.imageMessage)
        return m.reply('Please reply to an image.')

      const buffer = await m.quoted.download()

      if (!process.env.OCR_API_KEY) return m.reply('OCR API key is not configured.')
      const form = new FormData()
      form.append('apikey', process.env.OCR_API_KEY)
      form.append('language', 'eng')
      form.append('isOverlayRequired', 'false')
      form.append('file', buffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg',
      })

      const res = await axios.post(
        'https://api.ocr.space/parse/image',
        form,
        {
          headers: form.getHeaders(),
          maxBodyLength: Infinity,
        }
      )

      if (res.data.OCRExitCode !== 1) {
        return m.reply('OCR failed.')
      }

      const text = res.data.ParsedResults?.[0]?.ParsedText?.trim()
      if (!text) return m.reply('No text detected.')

      const safeText = text.slice(0, 3500)

      await sendInteractiveMessage(sock, m.from, {
        title: 'OCR RESULT',
        text: safeText,
        footer: 'XLICON v2 - Aʙᴢᴛᴇᴄʜ 🇬🇭',
        interactiveButtons: [
          {
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({
              display_text: 'Copy Text',
              copy_code: safeText
            })
          }
        ]
      })

    } catch (err) {
      console.error('OCR Error:', err)
      m.reply('Failed to process OCR.')
    }
  },
}
