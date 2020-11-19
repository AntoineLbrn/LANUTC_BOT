const Canvas = require("canvas");
const Discord = require("discord.js");
const utils = require("../utils/imageBuilderUtils");

module.exports = {
  getRank: getRank,
  getElo: getElo,
};

async function getElo(summonerName, league, championURL) {
  const canvas = Canvas.createCanvas(700, 250);
  const ctx = canvas.getContext(utils.CONTEXT);
  // Since the image takes time to load, you should await it
  await utils.loadBackground(canvas, ctx, utils.VERY_DARK_GREY);

  //print username background
  ctx.fillStyle = utils.DARK_GREY;
  ctx.fillRect(260, 0, canvas.width, 100);

  await utils.loadRankImage(canvas, ctx, league.tier);

  await utils.loadBestChampionImage(canvas, ctx, championURL);

  //print username
  ctx.font = utils.applyText(canvas, summonerName, utils.RANK.USERNAME.WIDTH);
  ctx.fillStyle = utils.WHITE;
  ctx.fillText(
    summonerName,
    utils.computeCenteredTextX(
      utils.ELO.USERNAME.X,
      ctx.measureText(summonerName).width,
      utils.ELO.USERNAME.WIDTH
    ),
    utils.ELO.USERNAME.Y
  );

  ctx.fillStyle = utils.GREY;

  //print division
  const tierAndRank = utils.generateTierAndRank(league.tier, league.rank);
  ctx.font = utils.applyText(canvas, tierAndRank, utils.ELO.DIVISION.WIDTH, 32);
  ctx.fillText(
    tierAndRank,
    utils.computeCenteredTextX(
      utils.ELO.DIVISION.X,
      ctx.measureText(tierAndRank).width,
      utils.ELO.DIVISION.WIDTH
    ),
    utils.ELO.DIVISION.Y
  );

  //print LP winrate

  const LPAndWinrate = league.leaguePoints
    ? league.leaguePoints +
      " LP | " +
      ((league.wins / (league.wins + league.losses)) * 100).toFixed(2) +
      "%"
    : "Unranked";

  ctx.font = utils.applyText(canvas, LPAndWinrate, utils.ELO.LP.WIDTH, 32);
  ctx.fillText(
    LPAndWinrate,
    utils.computeCenteredTextX(
      utils.ELO.LP.X,
      ctx.measureText(LPAndWinrate).width,
      utils.ELO.LP.WIDTH
    ),
    utils.ELO.LP.Y
  );

  return new Discord.MessageAttachment(canvas.toBuffer(), utils.RANK.FILENAME);
}

async function getRank(user, username, rank) {
  const canvas = Canvas.createCanvas(700, 250);
  const ctx = canvas.getContext(utils.CONTEXT);
  // Since the image takes time to load, you should await it
  await utils.loadBackground(canvas, ctx);
  const avatar = await Canvas.loadImage(
    user.displayAvatarURL({ format: utils.FORMAT })
  );
  const rankImg = await Canvas.loadImage(utils.RANK.PODIUM.IMG_URL);

  ctx.drawImage(
    avatar,
    utils.RANK.AVATAR.X,
    utils.RANK.AVATAR.Y,
    utils.RANK.AVATAR.WIDTH,
    utils.RANK.AVATAR.HEIGHT
  );

  ctx.drawImage(
    rankImg,
    utils.RANK.PODIUM.X,
    utils.RANK.PODIUM.Y,
    utils.RANK.PODIUM.WIDTH,
    utils.RANK.PODIUM.HEIGHT
  );

  //print username
  ctx.font = utils.applyText(canvas, username, utils.RANK.USERNAME.WIDTH);
  ctx.fillStyle = utils.WHITE;
  ctx.fillText(
    username,
    utils.computeCenteredTextX(
      utils.RANK.USERNAME.X,
      ctx.measureText(username).width,
      utils.RANK.USERNAME.WIDTH
    ),
    utils.RANK.USERNAME.Y
  );

  //print points
  ctx.font = utils.applyText(
    canvas,
    rank[utils.RANK.POINTS_INDEX] + utils.RANK.POINTS_STRING,
    utils.RANK.USERNAME.WIDTH
  );
  const pointsAsString =
    rank[utils.RANK.POINTS_INDEX] + utils.RANK.POINTS_STRING;
  ctx.fillText(
    pointsAsString,
    utils.computeCenteredTextX(
      utils.RANK.POINTS.X,
      ctx.measureText(pointsAsString).width,
      utils.RANK.POINTS.WIDTH
    ),
    utils.RANK.POINTS.Y
  );

  //print rank
  ctx.fillStyle = utils.YELLOW;
  ctx.font = utils.applyText(
    canvas,
    rank[utils.RANK.RANK_INDEX],
    utils.RANK.USERNAME.WIDTH
  );
  ctx.fillText(
    rank[utils.RANK.RANK_INDEX],
    utils.computeCenteredTextX(
      utils.RANK.RANK.X,
      ctx.measureText(rank[utils.RANK.RANK_INDEX]).width,
      utils.RANK.RANK.WIDTH
    ),
    utils.RANK.RANK.Y
  );

  return new Discord.MessageAttachment(canvas.toBuffer(), utils.RANK.FILENAME);
}
