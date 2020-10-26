const Canvas = require("canvas");

module.exports = {
  CONTEXT: "2d",
  BACKGROUND_URL: "./static/images/background.jpg",
  FORMAT: "png",
  WHITE: "#ffffff",
  YELLOW: "#F0E68C",
  RANK: {
    WIDTH: 700,
    HEIGHT: 250,
    FILENAME: "rank.png",
    RANK_INDEX: 0,
    POINTS_INDEX: 1,
    POINTS_STRING: " points",
    AVATAR: {
      X: 525,
      Y: 50,
      WIDTH: 140,
      HEIGHT: 140,
    },
    PODIUM: {
      IMG_URL: "./static/images/podium.png",
      X: 25,
      Y: 110,
      WIDTH: 100,
      HEIGHT: 100,
    },
    USERNAME: {
      WIDTH: 370,
      X: 152,
      Y: 83,
    },
    POINTS: {
      WIDTH: 370,
      X: 152,
      Y: 198,
    },
    RANK: {
      WIDTH: 100,
      X: 25,
      Y: 71,
    },
  },

  loadBackground: loadBackground,
  computeCenteredTextX: computeCenteredTextX,
  applyText: applyText,
};

async function loadBackground(canvas, ctx) {
  const background = await Canvas.loadImage(this.BACKGROUND_URL);
  // This uses the canvas dimensions to stretch the image onto the entire canvas
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
}

function computeCenteredTextX(boxX, textToCenterWidth, boxWidth) {
  return boxX + (boxWidth - textToCenterWidth) / 2;
}

function applyText(canvas, text) {
  const ctx = canvas.getContext("2d");
  // Declare a base size of the font
  let fontSize = 50;

  do {
    // Assign the font to the context and decrement it so it can be measured again
    ctx.font = `${(fontSize -= 1)}px sans-serif`;
    // Compare pixel width of the text to the canvas minus the approximate avatar size
  } while (ctx.measureText(text).width > this.RANK.USERNAME.WIDTH);

  // Return the result to use in the actual canvas
  return ctx.font;
}
