require('dotenv').config();
// Discord
const { Client } = require('discord.js');
const { GatewayIntentBits } = require('discord-api-types/v10');
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
discordClient.on('debug', console.log);
// Axios
const axios = require('axios');
const URL = 'https://rhsx.rickyqin.repl.co/api/display_board';

let message;
const REFRESH_RATE = 6000;
const Price = require('./utils/Price');
const Tools = require('./utils/Tools');
const createTable = require('text-table');

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
    const mainTable = [ ['Ticker', 'Last', 'Bid', 'Ask', 'Volume'] ];
    for(const symbol in data.tickers) {
        const ticker = data.tickers[symbol];
        const topBid = (ticker.bids.length > 0 ? ticker.bids[0].price : undefined);
        const topAsk = (ticker.asks.length > 0 ? ticker.asks[0].price : undefined);
        mainTable.push([symbol, Price.format(ticker.lastTradedPrice), Price.format(topBid), Price.format(topAsk), ticker.volume]);
    }
    str += '```\n' + createTable(mainTable) + '```\n\n';
    for(const symbol in data.tickers) {
        const ticker = data.tickers[symbol];
        str += `Ticker: **${symbol}**\n`;
        const orderBookTable = [ ['Bids', 'Asks'] ];
        for(let i = 0; i < Math.max(ticker.bids.length, ticker.asks.length); i++) {
            orderBookTable.push(['', '']);
            if(i < ticker.bids.length) {
                const bid = ticker.bids[i];
                orderBookTable[i+1][0] = `@${Price.format(bid.price)} x${bid.quantity}`;
            }
            if(i < ticker.asks.length) {
                const ask = ticker.asks[i];
                orderBookTable[i+1][1] = `@${Price.format(ask.price)} x${ask.quantity}`;
            }
        }
        str += '```\n' + createTable(orderBookTable) + '```\n';
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