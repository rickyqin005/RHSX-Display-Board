require('dotenv').config();
// Discord
const { Client } = require('discord.js');
const { GatewayIntentBits } = require('discord-api-types/v10');
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
discordClient.on('debug', console.log);
let message;
const REFRESH_RATE = 6000;
const Price = require('./utils/Price');
const Tools = require('./utils/Tools');
// Axios
const axios = require('axios');
const URL = 'https://rhsx.rickyqin.repl.co/api/display_board';

async function update() {
    const startTime = new Date();
    try {
        await message.edit(displayBoardString((await axios.get(URL)).data));
    } catch(error) {
        console.log(error);
    }
    console.log(`updated display board at ${Tools.dateStr(new Date())}, took ${new Date()-startTime}ms`);
    setTimeout(update, REFRESH_RATE);
}

function displayBoardString(data) {
    let str = `Last updated at ${Tools.dateStr(new Date())}\n`;
    str += '```\n';
    str += Tools.setW('Ticker', 8) + Tools.setW('Price', 10) + Tools.setW('Bid', 10) + Tools.setW('Ask', 10) + Tools.setW('Volume', 10) + '\n';
    for(const symbol in data.tickers) {
        const ticker = data.tickers[symbol];
        const topBid = (ticker.bids.length > 0 ? ticker.bids[0].price : undefined);
        const topAsk = (ticker.asks.length > 0 ? ticker.asks[0].price : undefined);
        str += Tools.setW(symbol, 8) + Tools.setW(Price.format(ticker.lastTradedPrice), 10) +
        Tools.setW(Price.format(topBid), 10) + Tools.setW(Price.format(topAsk), 10) + Tools.setW(ticker.volume, 10) + '\n';
    }
    str += '```\n\n';
    for(const symbol in data.tickers) {
        const ticker = data.tickers[symbol];
        str += `Ticker: **${symbol}**\n`;
        str += '```\n';
        str += Tools.setW('Bids', 16) + 'Asks' + '\n';
        for(let i = 0; i < Math.max(ticker.bids.length, ticker.asks.length); i++) {
            if(i < ticker.bids.length) {
                const bid = ticker.bids[i];
                str += Tools.setW(`@${Price.format(bid.price)} x${bid.quantity}`, 16);
            } else str += Tools.setW('', 16);
            if(i < ticker.asks.length) {
                const ask = ticker.asks[i];
                str += `@${Price.format(ask.price)} x${ask.quantity}`;
            }
            str += '\n';
        }
        str += '```\n';
    }
    return str;
}

async function run() {
    await discordClient.login(process.env['DISPLAY_BOARD_BOT_TOKEN']);
    console.log(`${discordClient.user.tag} is logged in`);
    const channel = await discordClient.channels.fetch(process.env['DISPLAY_BOARD_CHANNEL_ID']);
    message = await channel.messages.fetch(process.env['DISPLAY_BOARD_MESSAGE_ID']);
    setTimeout(update, 0);
}
run();