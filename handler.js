/**
 * Serialize Message
 * Created By ABZTECH
 * Follow https://github.com/abrahamdw882
 * Whatsapp : https://whatsapp.com/channel/0029VaMGgVL3WHTNkhzHik3c
 */

const { downloadMediaMessage } = require('@whiskeysockets/baileys')

const groupMetadataCache = new Map()
const GROUP_CACHE_TTL = 10 * 60 * 1000

async function getGroupMetadata(sock, jid) {
    const cached = groupMetadataCache.get(jid)

    if (cached && Date.now() - cached.timestamp < GROUP_CACHE_TTL) {
        return cached.data
    }

    try {
        const metadata = await sock.groupMetadata(jid)

        groupMetadataCache.set(jid, {
            data: metadata,
            timestamp: Date.now()
        })

        return metadata
    } catch {
        return cached?.data || null
    }
}

function normalizeJid(jid = '') {
    return String(jid).split(':')[0]
}

function getNumberFromJid(jid = '') {
    return normalizeJid(jid).split('@')[0]
}

function checkOwner(sender = '', sockUser = {}) {
    const owners = Array.isArray(global.owners)
        ? global.owners.map(normalizeJid)
        : []

    const user = normalizeJid(sender)

    const botIds = [
        normalizeJid(sockUser?.id),
        normalizeJid(sockUser?.lid)
    ].filter(Boolean)

    return owners.includes(user) || botIds.includes(user)
}

function checkDev(sender = '') {
    if (!global.dev || !Array.isArray(global.dev)) return false
    const user = normalizeJid(sender)
    const devIds = global.dev.map(normalizeJid)
    return devIds.includes(user)
}

async function serializeMessage(sock, msg) {
    const from = msg.key?.remoteJid || ''
    const isGroup = from.endsWith('@g.us')
    const sender = msg.key?.fromMe
        ? (sock.user?.id || sock.user?.lid || '')
        : (isGroup ? msg.key?.participant : from)

    const pushName = msg.pushName || (sender ? getNumberFromJid(sender) : 'Unknown')

    let body = ''
    const type = Object.keys(msg.message || {})[0] || ''

    if (msg.message?.interactiveResponseMessage) {
        body =
            msg.message.interactiveResponseMessage.buttonId ||
            msg.message.interactiveResponseMessage?.body?.text ||
            ''
    }
    else if (msg.message?.conversation) {
        body = msg.message.conversation
    }
    else if (msg.message?.extendedTextMessage?.text) {
        body = msg.message.extendedTextMessage.text
    }
    else if (msg.message?.imageMessage?.caption) {
        body = msg.message.imageMessage.caption
    }
    else if (msg.message?.videoMessage?.caption) {
        body = msg.message.videoMessage.caption
    }
    else if (msg.message?.documentMessage?.caption) {
        body = msg.message.documentMessage.caption
    }
    else if (msg.message?.buttonsResponseMessage?.selectedButtonId) {
        body = msg.message.buttonsResponseMessage.selectedButtonId
    }
    else if (msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
        body = msg.message.listResponseMessage.singleSelectReply.selectedRowId
    }
    else if (msg.message?.templateButtonReplyMessage?.selectedId) {
        body = msg.message.templateButtonReplyMessage.selectedId
    }

    const isMedia = [
        'imageMessage',
        'videoMessage',
        'documentMessage',
        'audioMessage',
        'stickerMessage'
    ].includes(type)

    const mediaType = type
        ? type.replace('Message', '').toLowerCase()
        : ''

    const mimetype = msg.message?.[type]?.mimetype || null

    const groupMetadata = isGroup
        ? await getGroupMetadata(sock, from)
        : null

    const groupParticipants = Array.isArray(groupMetadata?.participants)
        ? groupMetadata.participants
        : []

    const senderNormalized = normalizeJid(sender)
    const botNormalized = normalizeJid(sock.user?.id || sock.user?.lid || '')
    const senderNumber = getNumberFromJid(sender)

    const participantData = groupParticipants.find(p => {
        const pid = normalizeJid(p?.id || p?.jid || '')
        return pid === senderNormalized
    })

    const botData = groupParticipants.find(p => {
        const pid = normalizeJid(p?.id || p?.jid || '')
        return pid === botNormalized
    })

    const groupOwnerId = normalizeJid(
        groupMetadata?.owner ||
        groupMetadata?.subjectOwner ||
        ''
    )

    const isOwner = checkOwner(sender, sock.user)
    const isDev = checkDev(sender)
    const isAdmin = isGroup ? !!participantData?.admin : false
    const isBotAdmin = isGroup ? !!botData?.admin : false

    const isGroupOwner = isGroup
        ? senderNormalized === groupOwnerId ||
          normalizeJid(participantData?.id || participantData?.jid || '') === groupOwnerId
        : false

    let quoted

    const ctxInfo =
        msg.message?.extendedTextMessage?.contextInfo ||
        msg.message?.imageMessage?.contextInfo ||
        msg.message?.videoMessage?.contextInfo ||
        msg.message?.documentMessage?.contextInfo

    if (ctxInfo?.quotedMessage) {
        const qMsg = ctxInfo.quotedMessage
        const qType = Object.keys(qMsg || {})[0] || ''

        quoted = {
            key: {
                remoteJid: from,
                id: ctxInfo.stanzaId,
                participant: ctxInfo.participant || from
            },
            message: qMsg,
            type: qType,
            body:
                qMsg?.conversation ||
                qMsg?.extendedTextMessage?.text ||
                qMsg?.[qType]?.caption ||
                '',
            isMedia: [
                'imageMessage',
                'videoMessage',
                'documentMessage',
                'audioMessage',
                'stickerMessage'
            ].includes(qType),
            mediaType: qType
                ? qType.replace('Message', '').toLowerCase()
                : '',
            mimetype: qMsg?.[qType]?.mimetype || null,
            download: async () =>
                await downloadMediaMessage(
                    {
                        key: {
                            remoteJid: from,
                            id: ctxInfo.stanzaId,
                            participant: ctxInfo.participant || from
                        },
                        message: qMsg
                    },
                    'buffer',
                    {},
                    sock
                )
        }
    }

    return {
        key: msg.key,
        id: msg.key?.id,
        from,
        sender,
        senderNumber,
        pushName,
        isGroup,
        groupMetadata,
        body,
        text: body,
        type,
        mtype: type,
        isMedia,
        mediaType,
        mimetype,
        quoted,
        isOwner,
        isDev,
        isAdmin,
        isBotAdmin,
        isGroupOwner,
        isButtonResponse: !!msg.message?.interactiveResponseMessage,
        buttonId: msg.message?.interactiveResponseMessage?.buttonId || null,

        reply: async (content, options = {}) => {
            if (typeof content === 'string') {
                return await sock.sendMessage(
                    from,
                    { text: content, ...options },
                    { quoted: msg }
                )
            }
            else if (Buffer.isBuffer(content)) {
                return await sock.sendMessage(
                    from,
                    { image: content, ...options },
                    { quoted: msg }
                )
            }
            else if (typeof content === 'object') {
                return await sock.sendMessage(
                    from,
                    content,
                    { quoted: msg }
                )
            }
            else {
                return await sock.sendMessage(
                    from,
                    { text: String(content), ...options },
                    { quoted: msg }
                )
            }
        },

        send: async (content, options = {}) =>
            await sock.sendMessage(
                from,
                typeof content === 'string'
                    ? { text: content, ...options }
                    : content,
                { quoted: msg }
            ),

        react: async emoji =>
            await sock.sendMessage(
                from,
                {
                    react: {
                        text: emoji,
                        key: msg.key
                    }
                }
            ),

        forward: async (jid, force = false) =>
            await sock.sendMessage(
                jid,
                {
                    forward: msg,
                    force
                }
            ),

        download: async () =>
            isMedia
                ? await downloadMediaMessage(
                    msg,
                    'buffer',
                    {},
                    sock
                )
                : (quoted?.isMedia
                    ? await quoted.download()
                    : null)
    }
}

module.exports = serializeMessage
