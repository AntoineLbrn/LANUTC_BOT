const config = require("../config/configuration");
const messages = require("../static/messages");

module.exports = {
  RECEIVE_MESSAGE_CODE: "message",
  READY_CODE: "ready",
  MESSAGE_REACTION_ADD_CODE: "messageReactionAdd",
  COMMANDS: {
    SETUP_PRONOS: "setuppronos",
    STATISTICS: "statistics",
    STATISTICS_BO5: "statisticsBO5",
    PRONOS_BO1: "pronosBO1",
    PRONOS_BO5: "pronosBO5",
    LEADERBOARD: "leaderboard",
    RANK: "rank",
    UNSUBSCRIBE: "unsubscribe",
  },
  //Don't forget Heroku's server is 1 hours late from France
  VOTE_REMINDER: {
    HOURS: 19,
    MINUTES: 0,
  },
  isBO5Vote: isBO5Vote,
  isBO1Vote: isBO1Vote,
  isSetupMessageReaction: isSetupMessageReaction,
  getEmojiAsNumber: getEmojiAsNumber,
  teamNameWithoutFormatting: teamNameWithoutFormatting,
};

function isBO5Vote(vote) {
  return vote[1] === "bat";
}

function isBO1Vote(vote) {
  return vote[3] === "vs";
}

function isSetupMessageReaction(user, message, emoji) {
  return (
    !user.bot &&
    message.author.id === config.BOT_ID &&
    message.content === messages.SETUP_PRONOS &&
    emoji.name === "✅"
  );
}

function getEmojiAsNumber(emoji) {
  switch (emoji) {
    case "0️⃣":
      return 0;
    case "1️⃣":
      return 1;
    case "2️⃣":
      return 2;
    case "3️⃣":
      return 3;
  }
}

function teamNameWithoutFormatting(string) {
  return string.substring(2, string.length - 2);
}
