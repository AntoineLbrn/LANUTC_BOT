const Canvas = require("canvas");
const Discord = require("discord.js");
const imageBuilderConst = require("./imageBuilderConst");

module.exports = {
  getRank: getRank,
};

async function getRank(user, username, rank) {
  const canvas = Canvas.createCanvas(700, 250);
  const ctx = canvas.getContext(imageBuilderConst.CONTEXT);
  // Since the image takes time to load, you should await it
  await loadBackground(canvas, ctx);
  const avatar = await Canvas.loadImage(
    user.displayAvatarURL({ format: imageBuilderConst.FORMAT })
  );
  const rankImg = await Canvas.loadImage(imageBuilderConst.RANK.PODIUM.IMG_URL);

  ctx.drawImage(
    avatar,
    imageBuilderConst.RANK.AVATAR.X,
    imageBuilderConst.RANK.AVATAR.Y,
    imageBuilderConst.RANK.AVATAR.WIDTH,
    imageBuilderConst.RANK.AVATAR.HEIGHT
  );

  ctx.drawImage(
    rankImg,
    imageBuilderConst.RANK.PODIUM.X,
    imageBuilderConst.RANK.PODIUM.Y,
    imageBuilderConst.RANK.PODIUM.WIDTH,
    imageBuilderConst.RANK.PODIUM.HEIGHT
  );

  //print username
  ctx.font = applyText(canvas, username);
  ctx.fillStyle = imageBuilderConst.WHITE;
  ctx.fillText(
    username,
    computeCenteredTextX(
      imageBuilderConst.RANK.USERNAME.X,
      ctx.measureText(username).width,
      imageBuilderConst.RANK.USERNAME.WIDTH
    ),
    imageBuilderConst.RANK.USERNAME.Y
  );

  //print points
  ctx.font = applyText(
    canvas,
    rank[imageBuilderConst.RANK.POINTS_INDEX] +
      imageBuilderConst.RANK.POINTS_STRING
  );
  const pointsAsString =
    rank[imageBuilderConst.RANK.POINTS_INDEX] +
    imageBuilderConst.RANK.POINTS_STRING;
  ctx.fillText(
    pointsAsString,
    computeCenteredTextX(
      imageBuilderConst.RANK.POINTS.X,
      ctx.measureText(pointsAsString).width,
      imageBuilderConst.RANK.POINTS.WIDTH
    ),
    imageBuilderConst.RANK.POINTS.Y
  );

  //print rank
  ctx.fillStyle = imageBuilderConst.YELLOW;
  ctx.font = applyText(canvas, rank[imageBuilderConst.RANK.RANK_INDEX]);
  ctx.fillText(
    rank[imageBuilderConst.RANK.RANK_INDEX],
    computeCenteredTextX(
      imageBuilderConst.RANK.RANK.X,
      ctx.measureText(rank[imageBuilderConst.RANK.RANK_INDEX]).width,
      imageBuilderConst.RANK.RANK.WIDTH
    ),
    imageBuilderConst.RANK.RANK.Y
  );

  return new Discord.MessageAttachment(
    canvas.toBuffer(),
    imageBuilderConst.RANK.FILENAME
  );
}

async function loadBackground(canvas, ctx) {
  const background = await Canvas.loadImage(imageBuilderConst.BACKGROUND_URL);
  // This uses the canvas dimensions to stretch the image onto the entire canvas
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
}

function computeCenteredTextX(boxX, textToCenterWidth, boxWidth) {
  return boxX + (boxWidth - textToCenterWidth) / 2;
}

const applyText = (canvas, text) => {
  const ctx = canvas.getContext("2d");
  // Declare a base size of the font
  let fontSize = 50;

  do {
    // Assign the font to the context and decrement it so it can be measured again
    ctx.font = `${(fontSize -= 1)}px sans-serif`;
    // Compare pixel width of the text to the canvas minus the approximate avatar size
  } while (ctx.measureText(text).width > imageBuilderConst.RANK.USERNAME.WIDTH);

  // Return the result to use in the actual canvas
  return ctx.font;
};
