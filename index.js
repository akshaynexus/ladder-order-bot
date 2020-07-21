'use strict'

// ----------------------------------------------------------------------------

const ccxt = require('ccxt')
const scientificToDecimal = require('scientific-to-decimal')
const config = require('./config.json')

// ----------------------------------------------------------------------------
const orderConfig = {
  COIN: config.ordersconf.COIN,
  SellCoin: config.ordersconf.CoinEx,
  symbol: `${config.ordersconf.COIN}/${config.ordersconf.CoinEx}`,
  orderType: config.ordersconf.OrderType,
  side: config.ordersconf.Side, // Change this to buy if you want laddered buy orders
  incrementamount: config.ordersconf.IncrementPerc, // percent
  ordersTarget: config.ordersconf.OrdersTarget
}

var pricearray = [] // Array of prices to sell at
// Change the exchange if you want to use a different exchange
const exchange = new ccxt.southxchange({
  apiKey: config.exchangekey.apikey,
  secret: config.exchangekey.secretkey,
  verbose: false, // set to true to see more debugging output
  timeout: 60000,
  enableRateLimit: true // add this
})

// Get last array item
function last (array) {
  return array[array.length - 1]
}

async function getAvailBalance (coin) {
  // fetch Balance available of a coin
  const exchangebalance = await exchange.fetchBalance()
  return exchangebalance[coin].free
}

(async () => {
  // try to load markets first, retry on request timeouts until it succeeds:
  while (true) {
    try {
      await exchange.loadMarkets()
      break
    } catch (e) {
      if (e instanceof ccxt.RequestTimeout) {
        console.log(
          exchange.iso8601(Date.now()),
          e.constructor.name,
          e.message
        )
      }
    }
  }

  const tickerdata = await exchange.fetchTicker(orderConfig.symbol)
  const lastask = tickerdata.ask
  const lastbid = tickerdata.bid

  // Log the lowest ask price
  console.log(`Last Ask price for ${orderConfig.symbol} is ${scientificToDecimal(lastask)}`)
  console.log(`Last Bid price for ${orderConfig.symbol} is ${scientificToDecimal(lastbid)}`)
  pricearray.push(incrementPrice(getIsSell() ? lastask:lastbid ,orderConfig.incrementamount))
  const availBal = await getAvailBalance(getIsSell() ? orderConfig.COIN : orderConfig.SellCoin)
  // Loop until target orders and increment price by x percent and push to array
  for (var i = 0; i < orderConfig.ordersTarget; i++) {
    pricearray.push(incrementPrice(last(pricearray),orderConfig.incrementamount))
  }

  await tryOrders(availBal)
})()

function getIsSell(){
  return orderConfig.side === "sell";
}

function getSellAmount(availBal){
  return (availBal / orderConfig.ordersTarget).toFixed(getPreciscion());
}

function getBuyAmt(price,availBal){
  return (getSellAmount(availBal)/price).toFixed(getPreciscion());
}

function GetOrderAmt(price,availBal){
  return getIsSell()? getSellAmount(availBal): getBuyAmt(price,availBal);
}

const tryOrders = async (availBal) => {
  for (var i = 0; i <= pricearray.length; i++) {
    console.log(`At run : ${i}  With price as ${scientificToDecimal(pricearray[i])}  and amount as  ${GetOrderAmt(pricearray[i],availBal)}`)
    await tryOrder(
      pricearray[i],
      parseFloat(GetOrderAmt(pricearray[i],availBal))
    )
  }
}

function getPreciscion(){
  return 9;//set precsion as 9 due to dvt and other coins having sub satoshi prices
}

function incrementPrice (lastprice,incrementperct) {
  var newprice = lastprice + (lastprice * (incrementperct/ 100))
  return newprice
}

async function tryOrder (pricex, amt) {
  try {
    await exchange.createOrder(orderConfig.symbol, orderConfig.orderType, orderConfig.side, amt, pricex)
    return true
  } catch (e) {
    console.log(exchange.iso8601(Date.now()), e.constructor.name, e.message)
    console.log('Failed')
    return false
  }
}
