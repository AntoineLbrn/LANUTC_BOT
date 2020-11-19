const config = require("../config/configuration");
const messages = require("../static/messages");

module.exports = {
  RECEIVE_MESSAGE_CODE: "message",
  READY_CODE: "ready",
  MESSAGE_REACTION_ADD_CODE: "messageReactionAdd",
  COMMANDS: {
    SETUP_SUBSCRIPTION: "setupSubscription",
    SETUP_BOT: "setupBot",
    STATISTICS: "statistics",
    STATISTICS_BO5: "statisticsBO5",
    PRONOS_BO1: "pronosBO1",
    PRONOS_BO5: "pronosBO5",
    LEADERBOARD: "leaderboard",
    RANK: "rank",
    UNSUBSCRIBE: "unsubscribe",
    HELP: "help",
    ELO: "elo",
  },
  PERMISSIONS: {
    ADMINISTRATOR: "ADMINISTRATOR",
  },
  REACTIONS: {
    VALIDATE: "✅",
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
  isValidatePronosChannelReaction: isValidatePronosChannelReaction,
  isValidatePronosRoleReaction: isValidatePronosRoleReaction,
  getMemberByIdAndServer: getMemberByIdAndServer,
  setupChannelAndRolePermissions: setupChannelAndRolePermissions,
  getRoleByIdAndServer: getRoleByIdAndServer,
  initializeBotSetUp: initializeBotSetUp,
  stringWithOnlyDigits: stringWithOnlyDigits,
  getChannelByIdAndServer: getChannelByIdAndServer,
  addUserAndAddChannelIfNotExist: addUserAndAddChannelIfNotExist,
  isMessageContentACommand: isMessageContentACommand,
  isNotDirectMessage: isNotDirectMessage,
  isMemberAdministrator: isMemberAdministrator,
  setupBotStep1: setupBotStep1,
  setupBotStep2: setupBotStep2,
  setupBotStep3: setupBotStep3,
  setupBotStep4: setupBotStep4,
  isBotMessageAuthor: isBotMessageAuthor,
  isEmptyMessage: isEmptyMessage,
  getServerById: getServerById,
  joinFirstParameterWithNextOnes: joinFirstParameterWithNextOnes,
};

function getServerById(serverId, guilds) {
  return guilds.cache.get(serverId);
}

function isBO5Vote(vote) {
  return vote[1] === "bat";
}

function isBO1Vote(vote) {
  return vote[3] === "vs";
}

function joinFirstParameterWithNextOnes(params, joinPattern) {
  return params.slice(1).join(joinPattern);
}

function isValidatePronosRoleReaction(
  userWhoReacted,
  userWhoShouldReact,
  message,
  emoji
) {
  return (
    userWhoReacted.id === userWhoShouldReact.id &&
    message.content.startsWith(messages.SETUP_BOT_4) &&
    emoji.name === "✅"
  );
}
function isValidatePronosChannelReaction(
  userWhoReacted,
  userWhoShouldReact,
  message,
  emoji
) {
  return (
    userWhoReacted.id === userWhoShouldReact.id &&
    message.content.startsWith(messages.SETUP_BOT_2) &&
    emoji.name === "✅"
  );
}
function isSetupMessageReaction(user, message, emoji) {
  return (
    !user.bot &&
    message.author.id === config.BOT_ID &&
    message.content === messages.SETUP_SUBSCRIPTION &&
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

function getMemberByIdAndServer(memberId, server) {
  return server.members.cache.get(memberId);
}

function setupChannelAndRolePermissions(botSetUp) {
  botSetUp.pronosChannel.overwritePermissions([
    {
      id: botSetUp.server.id,
      deny: ["VIEW_CHANNEL"],
    },
    {
      id: botSetUp.pronosRole.id,
      allow: ["VIEW_CHANNEL"],
      deny: ["SEND_MESSAGES", "ADD_REACTIONS"],
    },
  ]);
}

function getRoleByIdAndServer(roleId, server) {
  return server.roles.cache.get(roleId);
}

function initializeBotSetUp() {
  return {
    server: null,
    isWaitingForChannel: false,
    channelFromCommandHasBeenCalled: null,
    pronosChannel: null,
    pronosRole: null,
    user: null,
    isWaitingForRole: false,
    isWaitingForChannelValidation: false,
    isWaitingForRoleValidation: false,
  };
}

function stringWithOnlyDigits(string) {
  return string.replace(/\D/g, "");
}

function getChannelByIdAndServer(channelId, server) {
  return server.channels.cache.get(channelId);
}

function getChannelIfExist(userToPingByChannel, channel) {
  return userToPingByChannel.find(
    (userChannel) => userChannel.channel.id === channel.id
  );
}

function addUserAndAddChannelIfNotExist(userToPingByChannel, channel, member) {
  const channelToEdit = getChannelIfExist(userToPingByChannel, channel);
  if (channelToEdit) {
    channelToEdit.user.push(member.toString());
  } else {
    userToPingByChannel.push({
      channel: channel,
      user: [member.toString()],
    });
  }
}

function isMessageContentACommand(content) {
  return content.substring(0, 1) === "!";
}

function isNotDirectMessage(message) {
  return message.member;
}

function isMemberAdministrator(member) {
  return member.hasPermission(this.PERMISSIONS.ADMINISTRATOR);
}

function setupBotStep1(message, botSetUp) {
  message.channel.send(messages.SETUP_BOT_1);
  botSetUp = initializeBotSetUp();
  botSetUp.isWaitingForChannel = true;
  botSetUp.channelFromCommandHasBeenCalled = message.channel;
  botSetUp.server = message.channel.guild;
  botSetUp.user = message.author;
}

function setupBotStep2(message, botSetUp) {
  const channelId = stringWithOnlyDigits(message.content);
  botSetUp.pronosChannel = getChannelByIdAndServer(channelId, botSetUp.server);
  botSetUp.isWaitingForChannel = false;
  botSetUp.isWaitingForChannelValidation = true;
  message.channel
    .send(messages.SETUP_BOT_2 + "**" + botSetUp.pronosChannel.name + "**")
    .then((messageFromBot) => messageFromBot.react(this.REACTIONS.VALIDATE));
}

function setupBotStep3(message, botSetUp) {
  botSetUp.isWaitingForChannelValidation = false;
  botSetUp.isWaitingForRole = true;
  message.channel.send(messages.SETUP_BOT_3);
}

function setupBotStep4(message, botSetUp) {
  const roleId = stringWithOnlyDigits(message.content);
  botSetUp.pronosRole = getRoleByIdAndServer(roleId, botSetUp.server);
  botSetUp.isWaitingForRole = false;
  botSetUp.isWaitingForRoleValidation = true;
  message.channel
    .send(messages.SETUP_BOT_4 + "**" + botSetUp.pronosRole.name + "**")
    .then((messageFromBot) => messageFromBot.react(this.REACTIONS.VALIDATE));
}

function isBotMessageAuthor(message) {
  return message.author.id === config.BOT_ID;
}

function isEmptyMessage(message) {
  const messageSplit = message.content.split(" ");
  return !(messageSplit && messageSplit[1]);
}
