const Api = require('./Api')
const Discord = require('discord.js');
const config = require('./configuration');
const messages = require('./messages.json');
const Canvas = require('canvas');
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
                        messages.STATISTICS_OF_THE_DAY + await Api.getStatisticsOfCurrentDay()
                    )
                    break;
                // !statisticsBO5
                case 'statisticsBO5':
                    message.channel.send(
                        messages.STATISTICS_OF_THE_DAY + await Api.getStatisticsOfCurrentDayBO5()
                    );
                    break;
                // !pronosBO1
                case 'pronosBO1':
                    const matches = await Api.getMatchesOfTheDay();
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
                    const BO5matches = await Api.getMatchesOfTheDay();
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
                    await Api.getLeaderboard(params)
                )
                break;
            case 'rank':
                message.channel.send(
                    await Api.getRankAsString(message.author)
                );
                break;
            case 'rankIMG':
                const rank = await Api.getRank(message.author);
                const member = message.guild.members.cache.get(message.author.id);
                const canvas = Canvas.createCanvas(700, 250);
                const ctx = canvas.getContext('2d');
                // Since the image takes time to load, you should await it
                const background = await Canvas.loadImage('./background.jpg');
                // This uses the canvas dimensions to stretch the image onto the entire canvas
                ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
                const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ format: 'png' }));
                const rankImg = await Canvas.loadImage("./rank.png");
                ctx.drawImage(avatar, 525, canvas.height / 2 - 150/2, 150, 150);
                ctx.drawImage(rankImg, 25, 110, 100, 100);

                ctx.font = applyText(canvas, member.displayName);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(member.displayName, canvas.width / 4.6, canvas.height / 3);
                console.log(rank);
                ctx.font = applyText(canvas, rank[1] + " points");
                ctx.fillText(rank[1] + " points", canvas.width / 3.5, canvas.height / 1.2);
                ctx.fillStyle = '#F0E68C';
                ctx.font = applyText(canvas, rank[0]);
                ctx.fillText(rank[0], canvas.width / 15, canvas.height / 3.5);

                // Use helpful Attachment class structure to process the file for you
                const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'rank.png');
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
                Api.fillPronos(user, pronos[2], pronos[5], 1).then(response => {
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
                Api.fillPronos(user, pronos[2], pronos[5], 2).then(response => {
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
            Api.addPronostiqueur(user).then(response => {
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
    Api.fillBO5Pronos(user, winningTeam, losingTeam, score).then(response => {
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

const applyText = (canvas, text) => {
    const ctx = canvas.getContext('2d');

    // Declare a base size of the font
    let fontSize = 50;

    do {
        // Assign the font to the context and decrement it so it can be measured again
        ctx.font = `${fontSize -= 1}px sans-serif`;
        // Compare pixel width of the text to the canvas minus the approximate avatar size
    } while (ctx.measureText(text).width > canvas.width - 330);

    // Return the result to use in the actual canvas
    return ctx.font;
};