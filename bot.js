import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";
import express from "express";

// --- ENV ---
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CH_ID = process.env.WATCH_CHANNEL_ID;
const RELAY_URL = process.env.RELAY_URL;
const RELAY_KEY = process.env.RELAY_KEY;

// --- Discord bot ---
const client = new Client({
  intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent]
});
client.once("ready",()=>console.log("✅ Dxd bot online as",client.user.tag));

client.on("messageCreate",async m=>{
  if(m.author.bot||m.channel.id!==CH_ID)return;
  try{
    await fetch(`${RELAY_URL}/from-discord`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "x-relay-key":RELAY_KEY
      },
      body:JSON.stringify({author:m.author.username,text:m.content})
    });
  }catch(e){console.error("relay err",e);}
});

client.login(TOKEN);

// --- Fake web server สำหรับ Render free tier ---
const app=express();
app.get("/",(_,res)=>res.send("Dxd bot alive ✅"));
const PORT=process.env.PORT||10000;
app.listen(PORT,"0.0.0.0",()=>console.log("Keepalive port",PORT));
