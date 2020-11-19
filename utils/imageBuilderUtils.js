const Canvas = require("canvas");

module.exports = {
  CONTEXT: "2d",
  BACKGROUND_URL: "./static/images/background.jpg",
  FORMAT: "png",
  WHITE: "#ffffff",
  YELLOW: "#F0E68C",
  GREY: "#ACACB6",
  DARK_GREY: "#59595D",
  VERY_DARK_GREY: "#313134",
  ELO: {
    WIDTH: 700,
    HEIGHT: 250,
    USERNAME: {
      WIDTH: 440,
      X: 260,
      Y: 70,
    },
    LP: {
      WIDTH: 290,
      X: 260,
      Y: 220,
    },
    DIVISION: {
      WIDTH: 290,
      X: 260,
      Y: 160,
    },
    CHAMPION_IMAGE: {
      X: 550,
      Y: 100,
      WIDTH: 150,
      HEIGHT: 150,
    },
    RANK_IMAGE: {
      URL: "./static/images/ranked_emblems/",
      EXTENSION: ".png",
      X: 5,
      Y: 5,
      WIDTH: 240,
      HEIGHT: 240,
    },
  },
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
  loadBestChampionImage: loadBestChampionImage,
  computeCenteredTextX: computeCenteredTextX,
  applyText: applyText,
  loadRankImage: loadRankImage,
  generateTierAndRank: generateTierAndRank,
};

async function loadRankImage(canvas, ctx, rank) {
  const background = await Canvas.loadImage(
    this.ELO.RANK_IMAGE.URL + rank + this.ELO.RANK_IMAGE.EXTENSION
  );
  ctx.drawImage(
    background,
    this.ELO.RANK_IMAGE.X,
    this.ELO.RANK_IMAGE.Y,
    this.ELO.RANK_IMAGE.WIDTH,
    this.ELO.RANK_IMAGE.HEIGHT
  );
}
async function loadBestChampionImage(canvas, ctx, bestChampionURL) {
  const background = await Canvas.loadImage(bestChampionURL);
  ctx.drawImage(
    background,
    this.ELO.CHAMPION_IMAGE.X,
    this.ELO.CHAMPION_IMAGE.Y,
    this.ELO.CHAMPION_IMAGE.WIDTH,
    this.ELO.CHAMPION_IMAGE.HEIGHT
  );
}

function generateTierAndRank(tier, rank) {
  let string = "";
  switch (tier) {
    case "CHALLENGER":
      string = "Challenger";
      break;
    case "GRANDMASTER":
      string = "Grandmaster";
      break;
    case "MASTER":
      string = "Master";
      break;
    case "DIAMOND":
      string = "Diamond " + rank;
      break;
    case "PLATINUM":
      string = "Platinum " + rank;
      break;
    case "GOLD":
      string = "Gold " + rank;
      break;
    case "SILVER":
      string = "Silver " + rank;
      break;
    case "BRONZE":
      string = "Bronze " + rank;
      break;
    case "IRON":
      string = "Iron " + rank;
      break;
  }
  return string;
}

async function loadBackground(canvas, ctx, backgroundColor) {
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    const background = await Canvas.loadImage(this.BACKGROUND_URL);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  }
  // This uses the canvas dimensions to stretch the image onto the entire canvas
}

function computeCenteredTextX(boxX, textToCenterWidth, boxWidth) {
  return boxX + (boxWidth - textToCenterWidth) / 2;
}

function applyText(canvas, text, boxWidth, fontSizeOverwrite) {
  const ctx = canvas.getContext("2d");
  // Declare a base size of the font
  let fontSize = fontSizeOverwrite ? fontSizeOverwrite : 50;

  do {
    // Assign the font to the context and decrement it so it can be measured again
    ctx.font = `${(fontSize -= 1)}px sans-serif`;
    // Compare pixel width of the text to the canvas minus the approximate avatar size
  } while (ctx.measureText(text).width > boxWidth);

  // Return the result to use in the actual canvas
  return ctx.font;
}
