LadderBot
=======================================

Simple bot to ladder buys and sells on a ccxt supported exchange

* * *
### Prerequisites
- NodeJS
- NPM or yarn

### Installation
With yarn
```shell
$ yarn install
```
With NPM
```shell
$ npm install
```
*   Edit apikey and secret key from exchange in config.json
*   Set pair data in config.json
*   Set increment percent and orders target.
*   Use negative increment percent for buy orders and positive increment for sell orders.
*   If you want to use a different exchange change the `const exchange =` 's contructor to the exchange you want to use.
### Usage
- `npm start` or `yarn start`
### License

This project is licensed under the MIT License