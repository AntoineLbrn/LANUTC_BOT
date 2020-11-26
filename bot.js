const imageBuilder = require("./src/imageBuilder");
const botUtils = require("./utils/botUtils");
const pronos = require("./src/pronos");
const leagueStats = require("./src/leagueStats");
const Discord = require("discord.js");
const config = require("./config/configuration");
const messages = require("./static/messages");
const schedule = require("node-schedule");

// Initialize Discord Bot
var bot = new Discord.Client();
let botSetUp = botUtils.initializeBotSetUp();

bot.on(botUtils.READY_CODE, () => {
  setActivity();
  startCronReminder();
});

bot.on(botUtils.RECEIVE_MESSAGE_CODE, async (message) => {
  if (botUtils.isMessageContentACommand(message.content)) {
    const cmd = message.content.substring(1);
    const params = cmd.split(" ");
    //admin only, check message.member to check it's not dm
    if (
      botUtils.isNotDirectMessage(message) &&
      botUtils.isMemberAdministrator(message.member)
    ) {
      switch (cmd) {
        // !setupBot
        case botUtils.COMMANDS.SETUP_BOT:
          botUtils.setupBotStep1(message, botSetUp);
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
            printBO1(matches, message);
          });
          break;
        }
        //pronosBO5
        case botUtils.COMMANDS.PRONOS_BO5: {
          message.channel.send(messages.HEADER_PRONO_PLAYOFF);
          await pronos.getMatchesOfTheDay().then((BO5matches) => {
            printBO5(BO5matches, message);
          });
          break;
        }
      }
    }
    switch (params[0]) {
      //!subscribeSummoner [name]
      case botUtils.COMMANDS.ADD_SUMMONER: {
        handleAddSummonerCommand(params, message);
        break;
      }
      //!elo [name]
      case botUtils.COMMANDS.ELO: {
        handleEloCommand(params, message);
        break;
      }
      //leagueStats.getElo(message.author)
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
          if (response > 0) {
            const server = botUtils.getServerById(response, bot.guilds);
            pronos.getPronoRoleId(server).then((pronosRoleId) => {
              if (pronosRoleId > 0) {
                const pronosRole = botUtils.getRoleByIdAndServer(
                  pronosRoleId,
                  server
                );
                const member = botUtils.getMemberByIdAndServer(
                  message.author.id,
                  server
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
            user = botUtils.getMemberByIdAndServer(
              message.author.id,
              message.guild
            ).user;
            username = botUtils.getMemberByIdAndServer(
              message.author.id,
              message.guild
            ).displayName;
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
    botUtils.setupBotStep2(message, botSetUp);
  } else if (botSetUp.isWaitingForRole && hasUserTypedPronosRole(message)) {
    botUtils.setupBotStep4(message, botSetUp);
  }
});

bot.on(botUtils.MESSAGE_REACTION_ADD_CODE, (reaction, user) => {
  const message = reaction.message;
  const emoji = reaction.emoji;
  if (!user.bot && botUtils.isBotMessageAuthor(message)) {
    reaction.users.remove(user.id);
    const vote = message.content.split(" ");
    const score = botUtils.getEmojiAsNumber(emoji.name);
    if (botUtils.isEmptyMessage(message)) {
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
              const pronosRole = botUtils.getRoleByIdAndServer(
                pronosRoleId,
                message.guild
              );
              const member = botUtils.getMemberByIdAndServer(
                user.id,
                message.guild
              );
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
      botUtils.setupBotStep3(message, botSetUp);
    } else if (
      botSetUp.isWaitingForRoleValidation &&
      botUtils.isValidatePronosRoleReaction(user, botSetUp.user, message, emoji)
    ) {
      botUtils.setupChannelAndRolePermissions(botSetUp);
      pronos.sendSettings(botSetUp).then((statusCode) => {
        if (statusCode === 0) {
          message.channel.send(messages.SETUP_BOT_5);
        } else if (statusCode === -3) {
          message.channel.send(messages.SERVER_ALREADY_SET_UP);
        } else {
          message.channel.send(messages.GENERIC_ERROR);
        }
        botUtils.initializeBotSetUp();
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
    botUtils.addUserAndAddChannelIfNotExist(
      userToPingByChannel,
      channel,
      member
    );
  }
  return userToPingByChannel;
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

function hasUserTypedPronosChannel(message) {
  const channelId = botUtils.stringWithOnlyDigits(message.content);
  return (
    message.channel.id === botSetUp.channelFromCommandHasBeenCalled.id &&
    botUtils.getChannelByIdAndServer(channelId, botSetUp.server) &&
    botSetUp.user.id === message.author.id
  );
}

function hasUserTypedPronosRole(message) {
  const roleId = botUtils.stringWithOnlyDigits(message.content);
  return (
    message.channel.id === botSetUp.channelFromCommandHasBeenCalled.id &&
    botUtils.getRoleByIdAndServer(roleId, botSetUp.server) &&
    botSetUp.user.id === message.author.id
  );
}

function printBO1(matches, message) {
  matches.forEach((match) => {
    message.channel
      .send("** :one: " + match[0] + " vs :two: " + match[1] + " **")
      .then((prono) => {
        prono.react("1️⃣");
        prono.react("2️⃣");
      });
  });
}

function printBO5(BO5matches, message) {
  BO5matches.forEach((match) => {
    message.channel.send(
      "**" + match[0] + " vs " + match[1] + "**, Un seul choix possible :"
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
}

async function handleEloCommand(params, message) {
  let summonerName = botUtils.joinFirstParameterWithNextOnes(params, " ");
  let smurfs = "";
  let summonerNames;
  if (!summonerName) {
    summonerNames = await leagueStats.getSummonerNamesByUserId(
      message.author.id
    );
  }
  if (botUtils.isSummonerNameUserId(summonerName)) {
    summonerNames = await leagueStats.getSummonerNamesByUserId(
      botUtils.stringWithOnlyDigits(summonerName)
    );
    if (!summonerNames) {
      message.channel.send(
        message.author.toString() + messages.SUMMONER_NOT_SUBSCRIBED
      );
      return;
    }
  }
  if (summonerNames) {
    summonerName = summonerNames[0];
    smurfs =
      " " +
      messages.SMURFS +
      botUtils.joinFirstParameterWithNextOnes(summonerNames, ", ");
  }

  if (summonerName) {
    leagueStats.getSoloLeagueBySummonerName(summonerName).then((soloLeague) => {
      if (soloLeague === leagueStats.ERROR_CODE.NO_SUMMONER) {
        message.channel.send(
          message.author.toString() + messages.SUMMONER_DOES_NOT_EXIST
        );
      } else {
        leagueStats
          .getBestChampionImageURLBySummonerName(summonerName)
          .then((bestChampionImageURL) => {
            imageBuilder
              .getElo(summonerName, soloLeague, bestChampionImageURL)
              .then((attachment) => {
                message.channel.send(
                  message.author.toString() + smurfs,
                  attachment
                );
              });
          });
      }
    });
  } else {
    message.author.send(messages.SELF_SUMMONER_NOT_SUBSCRIBED);
  }
}

async function handleAddSummonerCommand(params, message) {
  const summonerName = botUtils.joinFirstParameterWithNextOnes(params, " ");
  if (
    params[1] &&
    (await leagueStats.doesThisSummonerExistByName(summonerName))
  ) {
    await leagueStats.addSummonerName(message.author, summonerName);
  }
}
