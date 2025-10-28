import express from "express";
import fetch from "node-fetch";
import { Client, GatewayIntentBits, REST, Routes } from "discord.js";

// ------- ENV CONFIG -------
const TOKEN = process.env.DISCORD_BOT_TOKEN;     // token ของบอท
const APP_ID = process.env.DISCORD_APP_ID;       // Application ID (same as Client ID)
const GUILD_ID = process.env.WATCH_GUILD_ID;     // เซิร์ฟเวอร์ที่จะลง slash command
const RELAY_URL = process.env.RELAY_URL;         // เช่น https://dxd.onrender.com
const RELAY_KEY = process.env.RELAY_KEY;         // ต้องเท่ากับ SHARED_SECRET ใน relay

if (!TOKEN || !APP_ID || !GUILD_ID || !RELAY_URL || !RELAY_KEY) {
  console.error("Missing one of required env vars: DISCORD_BOT_TOKEN / DISCORD_APP_ID / WATCH_GUILD_ID / RELAY_URL / RELAY_KEY");
}

// ------- STEP 1: สร้าง client Discord -------
const client = new Client({
  intents: [
    // สำหรับ slash commands, จริง ๆ ไม่ต้อง MessageContent เลย
    GatewayIntentBits.Guilds,
  ]
});

client.once("ready", () => {
  console.log("✅ Dxd bot online as", client.user.tag);
});

// ------- STEP 2: handle interactionCreate (เวลามีคนใช้ /chatr) -------
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "chatr") return;

  const msgText = interaction.options.getString("message");

  // ส่งไปยัง relay -> /from-discord
  try {
    await fetch(`${RELAY_URL}/from-discord`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-relay-key": RELAY_KEY
      },
      body: JSON.stringify({
        author: interaction.user.username,
        text: msgText
      })
    });

    // ตอบในดิส
    await interaction.reply({
      content: `ส่งเข้า Roblox แล้ว: "${msgText}" ✅`,
      ephemeral: true // ให้เห็นเฉพาะคนที่ใช้คำสั่ง
    });
  } catch (err) {
    console.error("relay err", err);
    await interaction.reply({
      content: "ส่งเข้า Roblox ไม่ได้แฮะ 😢",
      ephemeral: true
    });
  }
});

// login bot
client.login(TOKEN);

// ------- STEP 3: สร้าง express server (Render needs a port) -------

const app = express();
app.use(express.json());

// health check
app.get("/", (_, res) => {
  res.send("Dxd bot alive ✅");
});

// route พิเศษ: /register-commands
// เราเรียกอันนี้ครั้งเดียว (GET ในเบราว์เซอร์) เพื่อให้บอทลงทะเบียน /chatr ใน guild ของเรา
app.get("/register-commands", async (_, res) => {
  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);

    // คำสั่ง /chatr
    const commands = [
      {
        name: "chatr",
        description: "ส่งข้อความเข้า Roblox ผ่าน DXD Relay",
        options: [
          {
            type: 3, // STRING
            name: "message",
            description: "พิมพ์ข้อความที่จะส่งเข้าเกม",
            required: true
          }
        ]
      }
    ];

    // register เป็น guild command (เร็ว, เห็นทันทีในเซิร์ฟเวอร์นั้น)
    await rest.put(
      Routes.applicationGuildCommands(APP_ID, GUILD_ID),
      { body: commands }
    );

    console.log("Slash command /chatr registered ✅");
    res.send("Registered /chatr ✅");
  } catch (e) {
    console.error("Failed to register commands", e);
    res.status(500).send("Failed to register :(");
  }
});

// Render free tier needs this:
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Keepalive server listening on", PORT);
});
