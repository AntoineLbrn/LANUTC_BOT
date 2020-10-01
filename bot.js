const fetch = require("node-fetch");

var Api = require('./Api')
var Discord = require('discord.js');
var auth = require('./auth.json');
// Initialize Discord Bot
var bot = new Discord.Client();

const SETUP_PRONOS_MESSAGE = 'Réagissez ✅ pour devenir pronostiqueur';
const BOT_ID = '746410404959223919'
const TOINOU_ID = '252426885244518400';
const filter = (reaction, user) => true //whatever emote you want to use, beware that .await.Reactions can only check a singel emote

bot.on('ready', () => {
    console.log('I am ready!');
});

bot.on('message', async message => {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.content.substring(0, 1) === '!') {
        const cmd = message.content.substring(1);
        //admin only
        if (message.author.id === TOINOU_ID) {
            switch (cmd) {
                case 'setuppronos':
                    message.channel.send(
                        SETUP_PRONOS_MESSAGE
                    ).then(message => message.react('✅'))
                    break;
                // !pronos
                case 'pronos':
                    const matches = await Api.getMatchesOfTheDay();
                    message.channel.send(
                        "Voici les matchs de demain ! Bon courage pour vos pronos :D N'oubliez pas de pronostiquer tous les matchs"
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
            }
        }
        switch (cmd) {
            case 'leaderboard':
                message.channel.send(
                    await Api.getLeaderboard()
                )
                break;
        }
    }
})
;

bot.on('messageReactionAdd', (reaction, user) => {
    const message = reaction.message
    const emoji = reaction.emoji;
    // TODO: Only if prono channel
    if (!user.bot && message.author.id === '746410404959223919') {
        const pronos = message.content.split(' ');
        if (emoji.name === '1️⃣') {
            Api.fillPronos(user, pronos[2], pronos[5], 1).then(response => {
                if (response === -2) {
                    user.send("Erreur inattendue, réessaie ou tag un admin");
                } else if (response === -1) {
                    user.send("Tu as déjà pronostiqué ce match, gros malin ! " + pronos[2] + "/" + pronos[5]);
                } else if (response === -3) {
                    user.send("Tu n'es pas inscrit aux pronostics... Étrange...");
                } else {
                    user.send("**Vote enregistré** : " + pronos[2] + " bat " + pronos[5]);
                }
            });
        } else if (emoji.name === '2️⃣') {
            Api.fillPronos(user, pronos[2], pronos[5], 2).then(response => {
                if (response === -2) {
                    user.send("Erreur inattendue, réessaie ou tag un admin");
                } else if (response === -1) {
                    user.send("Tu as déjà pronostiqué ce match, gros malin ! " + pronos[2] + "/" + pronos[5]);
                } else if (response === -3) {
                    user.send("Tu n'es pas inscrit aux pronostics... Étrange...");
                } else {
                    user.send("**Vote enregistré** : " + pronos[5] + " bat " + pronos[2]);
                }
            });
        }
        if (!user.bot
            && message.author.id === BOT_ID
            && message.content === SETUP_PRONOS_MESSAGE
            && emoji.name === '✅') {
            Api.addPronostiqueur(user).then(response => {
                if (response === -2) {
                    user.send("Erreur inattendue, réessaie ou tag un admin");
                } else if (response === -1) {
                    user.send("Tu es déjà inscrit, gros malin !");
                } else {
                    user.send("Ton inscription est validée ! Bravo :D");
                    const role = message.guild.roles.cache.find(role => role.name === "pronostiqueur");
                    const memberWhoReacted = message.guild.members.cache.get(user.id);
                    console.log(role);
                    console.log(memberWhoReacted);
                    memberWhoReacted.roles.add(role).then(response => console.log(response));
                }
            });
        }
    }
});

bot.login(auth.token);
