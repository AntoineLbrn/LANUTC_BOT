const Canvas = require("canvas");
const Discord = require("discord.js");
const utils = require("../utils/imageBuilderUtils");

module.exports = {
  getRank: getRank,
};

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
  ctx.font = utils.applyText(canvas, username);
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
    rank[utils.RANK.POINTS_INDEX] + utils.RANK.POINTS_STRING
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
  ctx.font = utils.applyText(canvas, rank[utils.RANK.RANK_INDEX]);
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
