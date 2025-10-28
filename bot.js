import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const WATCH_CHANNEL_ID = process.env.WATCH_CHANNEL_ID; // channel id ที่อยาก bridge
const RELAY_URL = process.env.RELAY_URL; // https://your-relay.onrender.com
const RELAY_KEY = process.env.RELAY_KEY; // ต้องตรงกับ SHARED_SECRET

if (!DISCORD_BOT_TOKEN || !WATCH_CHANNEL_ID || !RELAY_URL || !RELAY_KEY) {
  console.error("Missing env vars");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once("ready", () => {
  console.log("Bot ready", client.user.tag);
});

client.on("messageCreate", async (message) => {
  // ignore bots (รวมตัวเอง)
  if (message.author.bot) return;
  if (message.channel.id !== WATCH_CHANNEL_ID) return;

  const author = message.author.username;
  const text = message.content;

  try {
    await fetch(`${RELAY_URL}/from-discord`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-relay-key": RELAY_KEY
      },
      body: JSON.stringify({ author, text })
    });
  } catch (err) {
    console.error("Failed to POST to relay", err);
  }
});

client.login(DISCORD_BOT_TOKEN);

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => console.log("Relay listening on port", PORT));
