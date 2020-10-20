const imageBuilder = require('./imageBuilder');
const pronos = require('./pronos');
const Discord = require('discord.js');
const config = require('./configuration');
const messages = require('./messages.json');

// Initialize Discord Bot
var bot = new Discord.Client();


bot.on('ready', () => {
    console.log('I am ready!');
});

//TODO: implementer un rappel
bot.on('message', async message => {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.content.substring(0, 1) === '!') {
        const cmd = message.content.substring(1);
        const params = cmd.split(' ');
        //admin only, check message.member to check it's not dm
        if (message.member && message.member.hasPermission("ADMINISTRATOR")) {
            switch (cmd) {
                case 'setuppronos':
                    message.channel.send(
                        messages.SETUP_PRONOS
                    ).then(message => message.react('✅'))
                    break;
                // !statistics
                case 'statistics':
                    message.channel.send(
                        messages.STATISTICS_OF_THE_DAY + await pronos.getStatisticsOfCurrentDay()
                    )
                    break;
                // !statisticsBO5
                case 'statisticsBO5':
                    message.channel.send(
                        messages.STATISTICS_OF_THE_DAY + await pronos.getStatisticsOfCurrentDayBO5()
                    );
                    break;
                // !pronosBO1
                case 'pronosBO1':
                    const matches = await pronos.getMatchesOfTheDay();
                    message.channel.send(
                        messages.HEADER_PRONO
                    )
                    setTimeout(function () {
                        matches.forEach(match => {
                            message.channel.send(
                                "** :one: " + match[0] + " vs :two: " + match[1] + " **"
                            ).then(prono => {
                                prono.react('1️⃣');
                                prono.react('2️⃣');
                            });

                        })
                    }, 3000);
                    break;
                //pronosBO5
                case 'pronosBO5':
                    const BO5matches = await pronos.getMatchesOfTheDay();
                    message.channel.send(
                        messages.HEADER_PRONO_PLAYOFF
                    )
                    setTimeout(function () {
                        BO5matches.forEach(match => {
                            message.channel.send("**" + match[0] + " vs " + match[1] + "**, Un seul choix possible :");
                            message.channel.send(
                                "**" + match[0] + "**" + messages.BEATS +  "**" + match[1] + "** " +  " \n3-0 : 0️⃣\n3-1  : 1️⃣\n3-2 : 2️⃣\n"
                            ).then(prono => {
                                prono.react('0️⃣');
                                prono.react('1️⃣');
                                prono.react('2️⃣');
                            });
                            message.channel.send(
                                "\n**" + match[1] + "**" + messages.BEATS + "**" + match[0] + "** " + " \n3-0 : 0️⃣\n3-1  : 1️⃣\n3-2 : 2️⃣"
                            ).then(prono => {
                                prono.react('0️⃣');
                                prono.react('1️⃣');
                                prono.react('2️⃣');
                            });
                        })
                    }, 3000);
                    break;
            }
        }
        switch (params[0]) {
            case 'leaderboard':
                message.channel.send(
                    await pronos.getLeaderboard(params)
                );
                break;
            case 'rank':
                const member = message.guild.members.cache.get(message.author.id);
                const rank = await pronos.getRank(message.author);
                const attachment = await imageBuilder.getRank(member, rank);
                message.channel.send(message.author.toString(), attachment);
                break;
        }
    }
})
;

bot.on('messageReactionAdd', (reaction, user) => {
    const message = reaction.message
    const emoji = reaction.emoji;
    if (!user.bot && message.author.id === config.BOT_ID) {
        const pronos = message.content.split(' ');
        //BO5 vote
        const score = getEmojiAsNumber(emoji.name);
        if (pronos[1] === "bat") {
            handleBO5Reaction(score, user, pronos);
        } else {
            if (emoji.name === '1️⃣') {
                pronos.fillPronos(user, pronos[2], pronos[5], 1).then(response => {
                    if (response === -2) {
                        user.send(messages.GENERIC_ERROR);
                    } else if (response === -1) {
                        user.send(messages.PRONO_ALREADY_DONE + pronos[2] + "/" + pronos[5]);
                    } else if (response === -3) {
                        user.send(messages.NOT_A_PRONOSTIQUEUR);
                    } else {
                        user.send(messages.VOTE_RECEIVED + pronos[2] + messages.BEATS + pronos[5]);
                    }
                });
            } else if (emoji.name === '2️⃣') {
                pronos.fillPronos(user, pronos[2], pronos[5], 2).then(response => {
                    if (response === -2) {
                        user.send(messages.GENERIC_ERROR);
                    } else if (response === -1) {
                        user.send(messages.PRONO_ALREADY_DONE + pronos[2] + "/" + pronos[5]);
                    } else if (response === -3) {
                        user.send(messages.NOT_A_PRONOSTIQUEUR);
                    } else {
                        user.send(messages.VOTE_RECEIVED + pronos[5] + messages.BEATS + pronos[2]);
                    }
                });
            }
        }
        if (!user.bot
            && message.author.id === config.BOT_ID
            && message.content === messages.SETUP_PRONOS
            && emoji.name === '✅') {
            pronos.addPronostiqueur(user).then(response => {
                if (response === -2) {
                    user.send(messages.GENERIC_ERROR);
                } else if (response === -1) {
                    user.send(messages.PRONOSTIQUEUR_ALREADY_REGISTERED);
                } else {
                    user.send(messages.REGISTRATION_SUCCESS);
                    const role = message.guild.roles.cache.find(role => role.name ===
                        config.PRONOSTIQUEUR_ROLE_AS_STRING);
                    const memberWhoReacted = message.guild.members.cache.get(user.id);
                    console.log(role);
                    console.log(memberWhoReacted);
                    memberWhoReacted.roles.add(role).then(response => console.log(response));
                }
            });
        }
        message.channel.messages.fetch(message.id).then(messageEmbed => {
            messageEmbed.reactions.resolve(reaction).users.remove(user);
        });
    }
});

bot.login(config.BOT_TOKEN);


function getEmojiAsNumber(emoji) {
    switch (emoji) {
        case '0️⃣':
            return 0;
        case '1️⃣':
            return 1;
        case '2️⃣':
            return 2;
        case '3️⃣':
            return 3;
    }
}


function handleBO5Reaction(score, user, pronos) {
    const winningTeam = stringWithoutFormatting(pronos[0]);
    const losingTeam = stringWithoutFormatting(pronos[2]);
    pronos.fillBO5Pronos(user, winningTeam, losingTeam, score).then(response => {
        if (response === -2) {
            user.send(messages.GENERIC_ERROR);
        } else if (response === -1) {
            user.send(messages.PRONO_ALREADY_DONE);
        } else if (response === -3) {
            user.send(messages.NOT_A_PRONOSTIQUEUR);
        } else {
            user.send(messages.VOTE_RECEIVED + "3-" + score + messages.FOR + winningTeam);
        }
    });
}

function stringWithoutFormatting(string) {
    return string.substring(2,string.length-2);
}
