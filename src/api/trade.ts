import express from 'express';
import ccxt from 'ccxt';

import axios from 'axios';
import * as crypto from 'crypto';

const router = express.Router();

const getExchange = (platform: string, key: object) => {
  switch (platform) {
    case 'kraken': return new ccxt.kraken(key);
    case 'okx': return new ccxt.okx(key);
    case 'mexc': return new ccxt.mexc(key);
    case 'huobi': return new ccxt.huobi(key);
    case 'bitmart': return new ccxt.bitmart(key);
  }
};

router.get('/platforms', (req, res) => {
  res.json([
    'kraken',
    'okx',
    'mexc',
    'huobi',
    'bitmart',
  ]);
});

router.get('/symbols', async (req: any, res: any) => {
  try {
    const { platform } = req.query;
    const exchange = getExchange(platform, req.user.api[platform]);
    await exchange.loadMarkets();
    res.json(exchange.symbols);
  } catch (error) {
    console.log('Error getting symbols:', error.message);
    res.status(500).json();
  }
});

router.get('/trades', async (req: any, res: any) => {
  try {
    const { symbol, platform } = req.query;
    const exchange = getExchange(platform, req.user.api[platform]);
    const trades = await exchange.fetchTrades(symbol);
    res.json(trades);
  } catch (error) {
    console.log('Error getting trades:', error.message);
    res.status(500).json();
  }
});

router.get('/balance', async (req: any, res: any) => {
  try {
    const { platform, params } = req.query;
    const exchange = getExchange(platform, req.user.api[platform]);
    const balance = await exchange.fetchBalance(params);
    res.json(balance);
  } catch (error) {
    console.log('Error getting balance:', error.message);
    res.status(500).json();
  }
});

router.get('/orders', async (req: any, res: any) => {
  try {
    const { platform, symbol, marginMode } = req.query;
    const exchange = getExchange(platform, req.user.api[platform]);

    if (platform === 'mexc') {
      const orders = await exchange.fetchOrders(symbol, undefined, undefined, { marginMode: marginMode });
      res.json(orders);
      return;
    }

    if (platform === 'huobi') {
      const API_KEY = req.user.api[platform].apiKey;
      const SECRET_KEY = req.user.api[platform].secret;

      const getSignature = (method, path, params, secretKey) => {
        const orderedParams = Object.keys(params).sort().reduce((obj, key) => {
          obj[key] = params[key];
          return obj;
        }, {});
        const queryString = Object.keys(orderedParams).map(key => `${key}=${encodeURIComponent(orderedParams[key])}`).join('&');
        const meta = [method, 'api.huobi.pro', path, queryString].join('\n');
        const hash = crypto.createHmac('sha256', secretKey).update(meta).digest('base64');
        return hash;
      };

      const method = 'GET';
      const path = '/v1/order/openOrders';
      let timestamp = new Date().toISOString();
      timestamp = timestamp.substring(0, timestamp.length - 5);
      const params: any = {
        AccessKeyId: API_KEY,
        SignatureMethod: 'HmacSHA256',
        SignatureVersion: '2',
        Timestamp: timestamp,
      };
      params.Signature = getSignature(method, path, params, SECRET_KEY);
      const queryString = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
      const url = `https://api.huobi.pro${path}?${queryString}`;
      try {
        const response = await axios.get(url);
        const closed = await exchange.fetchClosedOrders(symbol, undefined, undefined, { marginMode: marginMode });
        res.json({ open: response.data, closed: closed });
      } catch (error) {
        console.log('Error getting orders:', error.message);
        res.status(500).json();
      }
      return;
    }

    const open = await exchange.fetchOpenOrders(symbol, undefined, undefined, { marginMode: marginMode });
    const closed = await exchange.fetchClosedOrders(symbol, undefined, undefined, { marginMode: marginMode });
    res.json({ open: open, closed: closed });
  } catch (error) {
    console.log('Error getting orders:', error.message);
    res.status(500).json();
  }
});

router.post('/create', async (req: any, res: any) => {
  try {
    const { platform, symbol, type, side, amount, price, params } = req.body;
    const exchange = getExchange(platform, req.user.api[platform]);
    const order = await exchange.createOrder(symbol, type, side, amount, price, params);
    res.json(order);
  } catch (error) {
    console.log('Error creating order:', error.message);
    res.status(500).json();
  }
});

router.post('/cancel', async (req: any, res: any) => {
  try {
    const { platform, id, symbol } = req.body;
    const exchange = getExchange(platform, req.user.api[platform]);
    await exchange.cancelOrder(id, symbol);
    res.json();
  } catch (error) {
    console.log('Error canceling order:', error.message);
    res.status(500).json();
  }
});

export default router;