const prod = require("./prod");
let config = prod;

//if not in prod environment
if (!prod.BOT_ID) {
  config = require("./dev.js");
}

module.exports = config;
