const config = require("../config/configuration");
const messages = require("../static/messages");
const apiGoogle = require("../src/apiGoogle");
const apiGoogleUtils = require("./apiGoogleUtils");

const OPTIONAL_COMMANDS = {
  SETUP_BOT: "setupBot",
  SETUP_SUBSCRIPTION: "setupSubscription",
  STATISTICS: "statistics",
  STATISTICS_BO5: "statisticsBO5",
  PRONOS_BO1: "pronosBO1",
  PRONOS_BO5: "pronosBO5",
  LEADERBOARD: "leaderboard",
  RANK: "rank",
  UNSUBSCRIBE: "unsubscribe",
  ELO: "elo",
  ADD_SUMMONER: "addSummoner",
  ELO_LEADERBOARD: "eloLeaderboard",
};

module.exports = {
  RECEIVE_MESSAGE_CODE: "message",
  READY_CODE: "ready",
  MESSAGE_REACTION_ADD_CODE: "messageReactionAdd",
  COMMANDS: {
    SETUP_SUBSCRIPTION: "setupSubscription",
    SETUP_BOT: "setupBot",
    SETUP_COMMANDS: "setupCommands",
    STATISTICS: "statistics",
    STATISTICS_BO5: "statisticsBO5",
    PRONOS_BO1: "pronosBO1",
    PRONOS_BO5: "pronosBO5",
    LEADERBOARD: "leaderboard",
    RANK: "rank",
    UNSUBSCRIBE: "unsubscribe",
    HELP: "help",
    ELO: "elo",
    ADD_SUMMONER: "addSummoner",
    ELO_LEADERBOARD: "eloLeaderboard",
  },
  OPTIONAL_COMMANDS: OPTIONAL_COMMANDS,
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
  ERROR_CODE: {
    BOT_HAS_NO_PERMISSIONS: -5,
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
  isSummonerNameUserId: isSummonerNameUserId,
  getNearestCommand: getNearestCommand,
  hasBotSetupPermissions: hasBotSetupPermissions,
  initializeBotCommands: initializeBotCommands,
  setupCommandsStep1: setupCommandsStep1,
  addCommand: addCommand,
  retrieveBotCommands: retrieveBotCommands,
  botCommandsAsString: botCommandsAsString,
};

const levenshtein = require("js-levenshtein");

function botCommandsAsString(commands) {
  let s = "";
  Object.keys(commands).forEach(function (key) {
    console.log(key);
    s += key + " : " + commands[key] + "\n";
  });
  return s;
}

function getNearestCommand(cmd, botCommands) {
  let min = 20;
  let nearestCommand = this.COMMANDS.SETUP_SUBSCRIPTION;
  for (let i in this.COMMANDS) {
    if (min > levenshtein(cmd, this.COMMANDS[i])) {
      nearestCommand = this.COMMANDS[i];
      min = levenshtein(cmd, this.COMMANDS[i]);
    }
  }
  for (let i in botCommands) {
    if (min > levenshtein(cmd, botCommands[i])) {
      nearestCommand = botCommands[i];
      min = levenshtein(cmd, botCommands[i]);
    }
  }
  return nearestCommand;
}

function isSummonerNameUserId(summonerName) {
  return summonerName.includes("@");
}

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

function hasBotSetupPermissions(message) {
  return (
    message.guild.member(config.BOT_ID).hasPermission("MANAGE_CHANNELS") &&
    message.guild.member(config.BOT_ID).hasPermission("MANAGE_ROLES")
  );
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

async function retrieveBotCommands(botCommands) {
  const sheet = await apiGoogle.getSheet();
  let i = apiGoogleUtils.SETTINGS_SHEET.FIRST_COMMAND_INDEX;
  while (
    sheet.sheets[apiGoogleUtils.SETTINGS_SHEET.INDEX].data[0].rowData[i] &&
    sheet.sheets[apiGoogleUtils.SETTINGS_SHEET.INDEX].data[0].rowData[i].values[
      apiGoogleUtils.SETTINGS_SHEET.COMMAND_ID_INDEX
    ].formattedValue
  ) {
    botCommands.commands[
      sheet.sheets[apiGoogleUtils.SETTINGS_SHEET.INDEX].data[0].rowData[
        i
      ].values[apiGoogleUtils.SETTINGS_SHEET.COMMAND_ID_INDEX].formattedValue
    ] =
      sheet.sheets[apiGoogleUtils.SETTINGS_SHEET.INDEX].data[0].rowData[
        i
      ].values[
        apiGoogleUtils.SETTINGS_SHEET.COMMAND_ALIAS_INDEX
      ].formattedValue;
    i++;
  }
}
function initializeBotCommands() {
  return {
    isWaitingForCommand: false,
    // you have to have "setup_commands" on google sheet.
    commands: {},
  };
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

function getCommandsList(alreadyBoundCommands) {
  return Object.keys(OPTIONAL_COMMANDS)
    .map(function (k) {
      return k;
    })
    .filter((k) => {
      if (!alreadyBoundCommands[k]) {
        return k;
      }
    })
    .join(", ");
}

function addCommand(botCommands, message) {
  botCommands.commands[message[0]] = message[1];
}

function setupCommandsStep1(message, botCommands) {
  botCommands.isWaitingForCommand = true;
  message.channel.send(
    messages.SETUP_COMMANDS_1 + getCommandsList(botCommands.commands)
  );
  return botCommands;
}

function setupBotStep1(message, botSetUp) {
  message.channel.send(messages.SETUP_BOT_1);
  botSetUp = initializeBotSetUp();
  botSetUp.isWaitingForChannel = true;
  botSetUp.channelFromCommandHasBeenCalled = message.channel;
  botSetUp.server = message.channel.guild;
  botSetUp.user = message.author;
  return botSetUp;
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
