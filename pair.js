const { giftedid } = require('./id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const { Storage } = require("megajs");
const {
    default: Gifted_Tech,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("@whiskeysockets/baileys");

// Configurable session prefix
const SESSION_PREFIX = process.env.SESSION_PREFIX || "ALI-MD~";

function randomMegaId(length = 6, numberLength = 4) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const number = Math.floor(Math.random() * Math.pow(10, numberLength));
    return `${result}${number}`;
}

async function uploadCredsToMega(credsPath) {
    const storage = await new Storage({
        email: 'techobed4@gmail.com',
        password: 'Trippleo1802obed'
    }).ready;

    if (!fs.existsSync(credsPath)) throw new Error("File not found: " + credsPath);

    const fileSize = fs.statSync(credsPath).size;
    const uploadResult = await storage.upload({
        name: `${randomMegaId()}.json`,
        size: fileSize
    }, fs.createReadStream(credsPath)).complete;

    const fileNode = storage.files[uploadResult.nodeId];
    return await fileNode.link();
}

function removeFile(filePath) {
    if (fs.existsSync(filePath)) fs.rmSync(filePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = giftedid();
    let num = req.query.number;

    async function GIFTED_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState(`./temp/${id}`);
        try {
            let Gifted = Gifted_Tech({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.macOS("Safari")
            });

            if (!Gifted.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await Gifted.requestPairingCode(num);
                if (!res.headersSent) await res.send({ code });
            }

            Gifted.ev.on('creds.update', saveCreds);

            Gifted.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
                if (connection === "open") {
                    await delay(2000); // fast response
                    const credsFile = `./temp/${id}/creds.json`;
                    if (!fs.existsSync(credsFile)) return console.error("File not found");

                    const megaUrl = await uploadCredsToMega(credsFile);
                    const sid = SESSION_PREFIX + megaUrl.split("https://mega.nz/file/")[1];

                    console.log(`Session ID: ${sid}`);

                    Gifted.groupAcceptInvite("Ik0YpP0dM8jHVjScf1Ay5S");

                    // First reply: session ID
                    const sidMsg = await Gifted.sendMessage(Gifted.user.id, { text: sid });

                    // Second reply: formatted message with externalAdReply
                    const pfp = await Gifted.profilePictureUrl(Gifted.user.id, 'image').catch(() => 'https://telegra.ph/file/1a2b3c4d5e6f7g8h9i.jpg');

                    const MESSAGE = `
*✅ SESSION GENERATED ✅*
Use your Session ID to deploy your bot safely!
`;

                    await Gifted.sendMessage(
                        Gifted.user.id,
                        {
                            text: MESSAGE,
                            contextInfo: {
                                externalAdReply: {
                                    title: "ALI-MD Session 🎀",
                                    body: "Session Generated Successfully ✅",
                                    thumbnailUrl: pfp,
                                    mediaType: 1,
                                    renderLargerThumbnail: true,
                                    sourceUrl: "https://github.com/ALI-INXIDE/ALI-MD"
                                }
                            }
                        },
                        { quoted: sidMsg }
                    );

                    await delay(100);
                    await Gifted.ws.close();
                    removeFile(`./temp/${id}`);
                } else if (
                    connection === "close" &&
                    lastDisconnect &&
                    lastDisconnect.error &&
                    lastDisconnect.error.output.statusCode != 401
                ) {
                    await delay(5000);
                    GIFTED_PAIR_CODE();
                }
            });
        } catch (err) {
            console.error(err);
            removeFile(`./temp/${id}`);
            if (!res.headersSent) await res.send({ code: "Service is Currently Unavailable" });
        }
    }

    return await GIFTED_PAIR_CODE();
});

module.exports = router;
