// bot.js
import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const RELAY_ENDPOINT = process.env.RELAY_ENDPOINT;
const RELAY_KEY = process.env.RELAY_KEY;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

client.on("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot || !msg.guild) return;
  if (msg.channel.name !== "relay-chat") return;

  const payload = {
    author: msg.author.username,
    text: msg.content,
  };

  try {
    const res = await fetch(RELAY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-relay-key": RELAY_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      console.log("📨 ส่งข้อความจาก Discord ไป Roblox แล้ว:", msg.content);
    } else {
      console.error("❌ ส่งไม่สำเร็จ:", await res.text());
    }
  } catch (err) {
    console.error("🔥 ERROR:", err);
  }
});

client.login(DISCORD_BOT_TOKEN);
