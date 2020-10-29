const imageBuilder = require("./src/imageBuilder");
const botUtils = require("./utils/botUtils");
const pronos = require("./src/pronos");
const Discord = require("discord.js");
const config = require("./config/configuration");
const messages = require("./static/messages");
const schedule = require("node-schedule");

// Initialize Discord Bot
var bot = new Discord.Client();
let botSetUp = initializeBotSetUp();

bot.on(botUtils.READY_CODE, () => {
  setActivity();
  startCronReminder();
});

bot.on(botUtils.RECEIVE_MESSAGE_CODE, async (message) => {
  // Our bot needs to know if it will execute a command
  // It will listen for messages that will start with `!`
  if (message.content.substring(0, 1) === "!") {
    const cmd = message.content.substring(1);
    const params = cmd.split(" ");
    //admin only, check message.member to check it's not dm
    if (message.member && message.member.hasPermission("ADMINISTRATOR")) {
      switch (cmd) {
        // !setupBot
        case botUtils.COMMANDS.SETUP_BOT:
          message.channel.send(messages.SETUP_BOT_1);
          botSetUp = initializeBotSetUp();
          botSetUp.isWaitingForChannel = true;
          botSetUp.channelFromCommandHasBeenCalled = message.channel;
          botSetUp.server = message.channel.guild;
          botSetUp.user = message.author;
          break;
        // !setupSubscription
        case botUtils.COMMANDS.SETUP_SUBSCRIPTION:
          message.channel
            .send(messages.SETUP_SUBSCRIPTION)
            .then((message) => message.react(botUtils.REACTIONS.VALIDATE));
          break;
        // !statistics
        case botUtils.COMMANDS.STATISTICS:
          message.channel.send(
            messages.STATISTICS_OF_THE_DAY +
              (await pronos.getStatisticsOfCurrentDay())
          );
          break;
        // !statisticsBO5
        case botUtils.COMMANDS.STATISTICS_BO5:
          message.channel.send(
            messages.STATISTICS_OF_THE_DAY +
              (await pronos.getStatisticsOfCurrentDayBO5())
          );
          break;
        // !pronosBO1
        case botUtils.COMMANDS.PRONOS_BO1: {
          message.channel.send(messages.HEADER_PRONO);
          await pronos.getMatchesOfTheDay().then((matches) => {
            matches.forEach((match) => {
              message.channel
                .send("** :one: " + match[0] + " vs :two: " + match[1] + " **")
                .then((prono) => {
                  prono.react("1️⃣");
                  prono.react("2️⃣");
                });
            });
          });
          break;
        }
        //pronosBO5
        case botUtils.COMMANDS.PRONOS_BO5: {
          message.channel.send(messages.HEADER_PRONO_PLAYOFF);
          await pronos.getMatchesOfTheDay().then((BO5matches) => {
            BO5matches.forEach((match) => {
              message.channel.send(
                "**" +
                  match[0] +
                  " vs " +
                  match[1] +
                  "**, Un seul choix possible :"
              );
              message.channel
                .send(
                  "**" +
                    match[0] +
                    "**" +
                    messages.BEATS +
                    "**" +
                    match[1] +
                    "** " +
                    " \n3-0 : 0️⃣\n3-1  : 1️⃣\n3-2 : 2️⃣\n"
                )
                .then((prono) => {
                  prono.react("0️⃣");
                  prono.react("1️⃣");
                  prono.react("2️⃣");
                });
              message.channel
                .send(
                  "\n**" +
                    match[1] +
                    "**" +
                    messages.BEATS +
                    "**" +
                    match[0] +
                    "** " +
                    " \n3-0 : 0️⃣\n3-1  : 1️⃣\n3-2 : 2️⃣"
                )
                .then((prono) => {
                  prono.react("0️⃣");
                  prono.react("1️⃣");
                  prono.react("2️⃣");
                });
            });
          });
          break;
        }
      }
    }
    switch (params[0]) {
      //!leaderboard [N]
      case botUtils.COMMANDS.LEADERBOARD:
        message.channel.send(await pronos.getLeaderboard(params));
        break;
      //!help
      case botUtils.COMMANDS.HELP:
        message.channel.send(messages.HELP_MESSAGE);
        break;
      //!unsubscribe
      case botUtils.COMMANDS.UNSUBSCRIBE:
        await pronos.unsubscribeUser(message.author).then((response) => {
          if (response === 0) {
            pronos.getPronoRoleId(message.guild).then((pronosRoleId) => {
              if (pronosRoleId > 0) {
                const pronosRole = getRoleByIdAndServer(
                  pronosRoleId,
                  message.guild
                );
                const member = getMemberByIdAndServer(
                  message.author.id,
                  message.guild
                );
                member.roles.remove(pronosRole);
                message.author.send(messages.UNSUBSCRIBED);
              } else {
                message.author.send(messages.GENERIC_ERROR);
              }
            });
          } else if (response === -3) {
            message.author.send(messages.NOT_A_PRONOSTIQUEUR);
          } else {
            message.author.send(messages.GENERIC_ERROR);
          }
        });
        break;
      //!rank
      case botUtils.COMMANDS.RANK:
        pronos.getRank(message.author).then((rank) => {
          let username;
          let user;
          //If message is sent on a server
          if (message.guild) {
            user = getMemberByIdAndServer(message.author.id, message.guild)
              .user;
            username = getMemberByIdAndServer(message.author.id, message.guild)
              .displayName;
            //If message is a private message
          } else {
            user = message.author;
            username = user.tag;
          }
          imageBuilder.getRank(user, username, rank).then((attachment) => {
            message.channel.send(message.author.toString(), attachment);
          });
        });
        break;
    }
  } else if (
    botSetUp.isWaitingForChannel &&
    hasUserTypedPronosChannel(message)
  ) {
    const channelId = stringWithOnlyDigits(message.content);
    botSetUp.pronosChannel = getChannelByIdAndServer(
      channelId,
      botSetUp.server
    );
    botSetUp.isWaitingForChannel = false;
    botSetUp.isWaitingForChannelValidation = true;
    message.channel
      .send(messages.SETUP_BOT_2 + "**" + botSetUp.pronosChannel.name + "**")
      .then((messageFromBot) =>
        messageFromBot.react(botUtils.REACTIONS.VALIDATE)
      );
  } else if (botSetUp.isWaitingForRole && hasUserTypedPronosRole(message)) {
    const roleId = stringWithOnlyDigits(message.content);
    botSetUp.pronosRole = getRoleByIdAndServer(roleId, botSetUp.server);
    botSetUp.isWaitingForRole = false;
    botSetUp.isWaitingForRoleValidation = true;
    message.channel
      .send(messages.SETUP_BOT_4 + "**" + botSetUp.pronosRole.name + "**")
      .then((messageFromBot) =>
        messageFromBot.react(botUtils.REACTIONS.VALIDATE)
      );
  }
});

bot.on(botUtils.MESSAGE_REACTION_ADD_CODE, (reaction, user) => {
  const message = reaction.message;
  const emoji = reaction.emoji;
  if (!user.bot && message.author.id === config.BOT_ID) {
    reaction.users.remove(user.id);
    const vote = message.content.split(" ");
    const score = botUtils.getEmojiAsNumber(emoji.name);
    //BO5 vote
    if (!(vote && vote[1])) {
      return;
    } else if (botUtils.isBO5Vote(vote)) {
      handleBO5Reaction(score, user, vote);
    } else if (botUtils.isBO1Vote(vote)) {
      handleBO1Reaction(score, user, vote, emoji);
    }
    if (botUtils.isSetupMessageReaction(user, message, emoji)) {
      pronos.addPronostiqueur(user, message.guild).then((response) => {
        if (response === -2) {
          user.send(messages.GENERIC_ERROR);
        } else if (response === -1) {
          user.send(messages.PRONOSTIQUEUR_ALREADY_REGISTERED);
        } else {
          pronos.getPronoRoleId(message.guild).then((pronosRoleId) => {
            if (pronosRoleId > 0) {
              const pronosRole = getRoleByIdAndServer(
                pronosRoleId,
                message.guild
              );
              const member = getMemberByIdAndServer(user.id, message.guild);
              member.roles.add(pronosRole);
              user.send(messages.REGISTRATION_SUCCESS);
            } else {
              user.send(messages.ROLE_HAS_NOT_BEEN_DEFINED);
            }
          });
        }
      });
    } else if (
      botSetUp.isWaitingForChannelValidation &&
      botUtils.isValidatePronosChannelReaction(
        user,
        botSetUp.user,
        message,
        emoji
      )
    ) {
      botSetUp.isWaitingForChannelValidation = false;
      botSetUp.isWaitingForRole = true;
      message.channel.send(messages.SETUP_BOT_3);
    } else if (
      botSetUp.isWaitingForRoleValidation &&
      botUtils.isValidatePronosRoleReaction(user, botSetUp.user, message, emoji)
    ) {
      botSetUp.isWaitingForRoleValidation = false;
      setupChannelAndRolePermissions(botSetUp);
      pronos.sendSettings(botSetUp).then((statusCode) => {
        if (statusCode === 0) {
          message.channel.send(messages.SETUP_BOT_5);
        } else if (statusCode === -3) {
          message.channel.send(messages.SERVER_ALREADY_SET_UP);
        } else {
          message.channel.send(messages.GENERIC_ERROR);
        }
      });
    }
  }
});

bot.login(config.BOT_TOKEN);

function handleBO1Reaction(score, user, vote, emoji) {
  if (emoji.name === "1️⃣") {
    pronos.fillPronos(user, vote[2], vote[5], 1).then((response) => {
      if (response === -2) {
        user.send(messages.GENERIC_ERROR);
      } else if (response === -1) {
        user.send(messages.PRONO_ALREADY_DONE + vote[2] + "/" + vote[5]);
      } else if (response === -3) {
        user.send(messages.NOT_A_PRONOSTIQUEUR);
      } else {
        user.send(messages.VOTE_RECEIVED + vote[2] + messages.BEATS + vote[5]);
      }
    });
  } else if (emoji.name === "2️⃣") {
    pronos.fillPronos(user, vote[2], vote[5], 2).then((response) => {
      if (response === -2) {
        user.send(messages.GENERIC_ERROR);
      } else if (response === -1) {
        user.send(messages.PRONO_ALREADY_DONE + vote[2] + "/" + vote[5]);
      } else if (response === -3) {
        user.send(messages.NOT_A_PRONOSTIQUEUR);
      } else {
        user.send(messages.VOTE_RECEIVED + vote[5] + messages.BEATS + vote[2]);
      }
    });
  }
}
function handleBO5Reaction(score, user, vote) {
  const winningTeam = botUtils.teamNameWithoutFormatting(vote[0]);
  const losingTeam = botUtils.teamNameWithoutFormatting(vote[2]);
  pronos
    .fillBO5Pronos(user, winningTeam, losingTeam, score)
    .then((response) => {
      if (response === -2) {
        user.send(messages.GENERIC_ERROR);
      } else if (response === -1) {
        user.send(messages.PRONO_ALREADY_DONE);
      } else if (response === -3) {
        user.send(messages.NOT_A_PRONOSTIQUEUR);
      } else {
        user.send(
          messages.VOTE_RECEIVED + "3-" + score + messages.FOR + winningTeam
        );
      }
    });
}
async function getUserToPingByChannel(usersToPing) {
  let userToPingByChannel = [];
  for (const userToPing of usersToPing) {
    const channel = bot.channels.cache.get(userToPing.channelId);
    const server = bot.guilds.cache.get(userToPing.serverId);
    const member = await server.members.fetch(userToPing.userId);
    addUserAndAddChannelIfNotExist(userToPingByChannel, channel, member);
  }
  return userToPingByChannel;
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

function getChannelIfExist(userToPingByChannel, channel) {
  return userToPingByChannel.find(
    (userChannel) => userChannel.channel.id === channel.id
  );
}

function startCronReminder() {
  schedule.scheduleJob(
    botUtils.VOTE_REMINDER.MINUTES +
      " " +
      botUtils.VOTE_REMINDER.HOURS +
      " * * *",
    () => {
      pronos.getUsersWhoDidNotVote().then((usersToPing) => {
        if (usersToPing && usersToPing.length) {
          getUserToPingByChannel(usersToPing).then((userToPingByChannel) => {
            userToPingByChannel.forEach((userChannel) => {
              userChannel.channel.send(
                messages.FORGOT_PRONOS + " " + userChannel.user.join()
              );
            });
          });
        } else {
          console.log(messages.NO_USERS_TO_PING);
        }
      });
    }
  );
}

function setActivity() {
  bot.user.setActivity(messages.BOT_ACTIVITY);
}

function getChannelByIdAndServer(channelId, server) {
  return server.channels.cache.get(channelId);
}

function hasUserTypedPronosChannel(message) {
  const channelId = stringWithOnlyDigits(message.content);
  return (
    message.channel.id === botSetUp.channelFromCommandHasBeenCalled.id &&
    getChannelByIdAndServer(channelId, botSetUp.server) &&
    botSetUp.user.id === message.author.id
  );
}

function stringWithOnlyDigits(string) {
  return string.replace(/\D/g, "");
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

function hasUserTypedPronosRole(message) {
  const roleId = stringWithOnlyDigits(message.content);
  return (
    message.channel.id === botSetUp.channelFromCommandHasBeenCalled.id &&
    getRoleByIdAndServer(roleId, botSetUp.server) &&
    botSetUp.user.id === message.author.id
  );
}

function getRoleByIdAndServer(roleId, server) {
  return server.roles.cache.get(roleId);
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

function getMemberByIdAndServer(memberId, server) {
  return server.members.cache.get(memberId);
}
