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
    const mainTableAlign = ['l', 'r', 'r', 'r', 'r'];
    for(const symbol in data.tickers) {
        const ticker = data.tickers[symbol];
        const topBid = (ticker.bids.length > 0 ? ticker.bids[0].price : undefined);
        const topAsk = (ticker.asks.length > 0 ? ticker.asks[0].price : undefined);
        mainTable.push([symbol, Price.format(ticker.lastTradedPrice), Price.format(topBid), Price.format(topAsk), ticker.volume]);
    }
    str += '```\n' + createTable(mainTable, { align: mainTableAlign }) + '```\n\n';
    for(const symbol in data.tickers) {
        const ticker = data.tickers[symbol];
        str += `Ticker: **${symbol}**\n`;
        const orderBookTable = [ ['Bids', '', 'Asks', ''] ];
        const orderBookTableAlign = ['r', 'r', 'r', 'r'];
        let bidsWidth = 0;
        let asksWidth = 0;
        for(let i = 0; i < Math.max(ticker.bids.length, ticker.asks.length); i++) {
            orderBookTable.push(['', '', '', '']);
            if(i < ticker.bids.length) {
                const bid = ticker.bids[i];
                orderBookTable[i+1][0] = `@${Price.format(bid.price)}`;
                orderBookTable[i+1][1] = `x${bid.quantity}`;
                bidsWidth = Math.max(bidsWidth, orderBookTable[i+1][0].length);
            }
            if(i < ticker.asks.length) {
                const ask = ticker.asks[i];
                orderBookTable[i+1][2] = `@${Price.format(ask.price)}`;
                orderBookTable[i+1][3] = `x${ask.quantity}`;
                asksWidth = Math.max(asksWidth, orderBookTable[i+1][2].length);
            }
        }
        orderBookTable[0][0] = Tools.setW(orderBookTable[0][0], bidsWidth);
        orderBookTable[0][2] = Tools.setW(orderBookTable[0][2], asksWidth);
        str += '```\n' + createTable(orderBookTable, { align: orderBookTableAlign }) + '```\n';
    }
    return str;
}

async function run() {
    await discordClient.login(process.env['BOT_TOKEN']);
    console.log(`${discordClient.user.tag} is logged in`);
    const channel = await discordClient.channels.fetch(process.env['CHANNEL_ID']);
    message = await channel.messages.fetch(process.env['MESSAGE_ID']);
    setTimeout(update, 0);
}
run();