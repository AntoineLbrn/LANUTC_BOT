const prod = require('./config/prod');
let config = prod;

//if not in prod environment
if (!prod.BOT_ID) {
    config = require('./config/dev.js');
}

module.exports = config;
