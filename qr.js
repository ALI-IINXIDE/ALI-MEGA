const { exec } = require("child_process");
const { upload } = require("./mega");
const express = require("express");
let router = express.Router();
const pino = require("pino");
const { toBuffer } = require("qrcode");
const path = require("path");
const fs = require("fs-extra");
const { Boom } = require("@hapi/boom");

const MESSAGE = process.env.MESSAGE || `
*「 SESSION ID CONNECT: 」*
*╭─────────────────⳹*
*│✅ ʏᴏᴜʀ sᴇssɪᴏɴ ɪᴅ ɪs ʀᴇᴀᴅʏ!*
*│⚠️ ᴋᴇᴇᴘ ɪᴛ ᴘʀɪᴠᴀᴛᴇ ᴀɴᴅ sᴇᴄᴜʀᴇ*
*│🔐 ᴅᴏɴ'ᴛ sʜᴀʀᴇ ɪᴛ ᴡɪᴛʜ ᴀɴʏᴏɴᴇ*
*│✨ ᴇxᴘʟᴏʀᴇ ᴀʟʟ ᴛʜᴇ ᴄᴏᴏʟ ғᴇᴀᴛᴜʀᴇs*
*│🤖 ᴇɴᴊᴏʏ sᴇᴀᴍʟᴇss ᴀᴜᴛᴏᴍᴀᴛɪᴏɴ!*
*╰─────────────────⳹*
🪀 *ᴏғғɪᴄɪᴀʟ ᴄʜᴀɴɴᴇʟ:*  
 *Https://whatsapp.com/channel/0029VaoRxGmJpe8lgCqT1T2h*

🖇️ *ɢɪᴛʜᴜʙ ʀᴇᴘᴏ:*  
 *Https://github.com/ALI-INXIDE/ALI-MD*
`;

if (fs.existsSync('./auth_info_baileys')) fs.emptyDirSync('./auth_info_baileys');

router.get("/", async (req, res) => {
  const {
    default: SuhailWASocket,
    useMultiFileAuthState,
    Browsers,
    delay,
    DisconnectReason,
    makeInMemoryStore,
  } = require("@whiskeysockets/baileys");

  const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });

  async function SUHAIL() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth_info_baileys");
    try {
      const Smd = SuhailWASocket({
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS("Desktop"),
        auth: state,
      });

      Smd.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect, qr } = s;

        if (qr && !res.headersSent) {
          try {
            const qrBuffer = await toBuffer(qr);
            res.setHeader("Content-Type", "image/png");
            res.end(qrBuffer);
            return;
          } catch (err) {
            console.error("QR Code Error:", err);
            return;
          }
        }

        if (connection === "open") {
          await delay(2000);
          const user = Smd.user.id;

          // 🌀 Random Session Name
          function randomMegaId(length = 6, numberLength = 4) {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            let result = "";
            for (let i = 0; i < length; i++)
              result += chars.charAt(Math.floor(Math.random() * chars.length));
            const number = Math.floor(Math.random() * Math.pow(10, numberLength));
            return `${result}${number}`;
          }

          const auth_path = "./auth_info_baileys/";
          const mega_url = await upload(
            fs.createReadStream(auth_path + "creds.json"),
            `${randomMegaId()}.json`
          );
          const Scan_Id = `ALI-MD~${mega_url.replace("https://mega.nz/file/", "")}`; 

          console.log(`✅ SESSION GENERATED: ${Scan_Id}`);

          // 📨 First Reply → Session ID
          const reply1 = await Smd.sendMessage(user, { text: Scan_Id });

          // 🖼 Second Reply → PFP + ExternalAdReply + Text
          const ppUrl = await Smd.profilePictureUrl(user, "image").catch(
            () => "https://files.catbox.moe/kyllga.jpg"
          );

          await Smd.sendMessage(
            user,
            {
              text: MESSAGE,
              contextInfo: {
                externalAdReply: {
                  title: "ALIZ-MD SESSION 🎀",
                  body: "Session Generated Successfully ✅",
                  thumbnailUrl: ppUrl,
                  mediaType: 1,
                  renderLargerThumbnail: true,
                  sourceUrl: "https://github.com/Obedweb/Hunter-Xmd1",
                },
              },
            },
            { quoted: reply1 }
          );

          await delay(1000);
          fs.emptyDirSync("./auth_info_baileys");
        }

        Smd.ev.on("creds.update", saveCreds);

        if (connection === "close") {
          const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
          if (reason === DisconnectReason.restartRequired) {
            console.log("Restart Required 🔁");
            SUHAIL().catch(console.log);
          } else {
            console.log("Reconnecting...");
            exec("pm2 restart qasim");
          }
        }
      });
    } catch (err) {
      console.log("Error:", err);
      fs.emptyDirSync("./auth_info_baileys");
      exec("pm2 restart qasim");
    }
  }

  SUHAIL().catch(async (err) => {
    console.log(err);
    fs.emptyDirSync("./auth_info_baileys");
    exec("pm2 restart qasim");
  });

  return await SUHAIL();
});

module.exports = router;
