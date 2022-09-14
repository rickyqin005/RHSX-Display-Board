require('dotenv').config();
// Discord
const { Client } = require('discord.js');
const { GatewayIntentBits } = require('discord-api-types/v10');
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
let message;
const REFRESH_RATE = 6000;
// Axios
const axios = require('axios');
const URL = 'https://rhsx.rickyqin.repl.co/api/display_board';

async function update() {
    const startTime = new Date();
    try {
        console.log(await axios.get(URL));
        // await message.edit(await axios.get(URL));
    } catch(error) {
        console.log(error);
    }
    console.log(`updated display board at ${new Date()}, took ${new Date()-startTime}ms`);
    // console.log(`updated display board at ${Tools.dateStr(new Date())}, took ${new Date()-startTime}ms`);
    setTimeout(update, REFRESH_RATE);
}

async function run() {
    await discordClient.login(process.env['DISPLAY_BOARD_BOT_TOKEN']);
    console.log(`${discordClient.user.tag} is logged in`);
    const channel = await global.discordClient.channels.fetch(process.env['DISPLAY_BOARD_CHANNEL_ID']);
    message = await channel.messages.fetch(process.env['DISPLAY_BOARD_MESSAGE_ID']);
    setTimeout(update, 0);
}
run();