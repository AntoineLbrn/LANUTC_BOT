const pronos = require("./pronos");
const riotApi = require("./riotApi");
const riotApiUtils = require("../utils/riotApiUtils");
const apiGoogle = require("./apiGoogle");
const apiGoogleUtils = require("../utils/apiGoogleUtils");

const ERROR_CODE = {
  NO_SUMMONER: 1,
  NO_RANKED: 2,
};

module.exports = {
  getSoloLeagueBySummonerName: getSoloLeagueBySummonerName,
  getBestChampionImageURLBySummonerName: getBestChampionImageURLBySummonerName,
  ERROR_CODE: ERROR_CODE,
  getSummonerNamesByUserId: getSummonerNamesByUserId,
  doesThisSummonerExistByName: doesThisSummonerExistByName,
  addSummonerName: addSummonerName,
  getEloLeaderboard: getEloLeaderboard,
};

async function getAllSummonerMains() {
  const sheet = await apiGoogle.getSheet();
  let summoners = [];
  let i = 3;
  while (
    sheet.sheets[apiGoogleUtils.SUMMONER_SHEET.INDEX].data[0].rowData[i] &&
    sheet.sheets[apiGoogleUtils.SUMMONER_SHEET.INDEX].data[0].rowData[i].values[
      apiGoogleUtils.SUMMONER_SHEET.USER_ID_INDEX
    ]
  ) {
    if (
      sheet.sheets[apiGoogleUtils.SUMMONER_SHEET.INDEX].data[0].rowData[i]
        .values[apiGoogleUtils.SUMMONER_SHEET.SUMMONER_NAME_COLUMN_INDEX]
    ) {
      summoners.push(
        sheet.sheets[apiGoogleUtils.SUMMONER_SHEET.INDEX].data[0].rowData[i]
          .values[apiGoogleUtils.SUMMONER_SHEET.SUMMONER_NAME_COLUMN_INDEX]
          .formattedValue
      );
    }
    i++;
  }
  return summoners;
}

async function getAllSummonersElo(summoners) {
  let summonersElo = [];
  for (const summoner of summoners) {
    summonersElo.push(await getSoloLeagueBySummonerName(summoner));
  }
  return summonersElo;
}

function eloAsInt(a) {
  return tierAsInt(a.tier) + rankAsInt(a.rank) + a.leaguePoints;
}

function rankAsInt(rank) {
  switch (rank) {
    case "IV": {
      return 0;
    }
    case "III": {
      return 100;
    }
    case "II": {
      return 200;
    }
    case "I": {
      return 300;
    }
  }
}

function tierAsInt(tier) {
  switch (tier) {
    case "IRON": {
      return 0;
    }
    case "BRONZE": {
      return 1000;
    }
    case "SILVER": {
      return 2000;
    }
    case "GOLD": {
      return 3000;
    }
    case "PLATINUM": {
      return 4000;
    }
    case "DIAMOND": {
      return 5000;
    }
    case "MASTER": {
      return 6000;
    }
    case "GRANDMASTER": {
      return 6000;
    }
    case "CHALLENGER": {
      return 6000;
    }
    default: {
      return -1000;
    }
  }
}

function formatSummonersElo(summonersElo) {
  let formattedSummonersElo = "";
  for (const summoner of summonersElo) {
    formattedSummonersElo +=
      summoner.summonerName +
      " : " +
      summoner.tier +
      " " +
      summoner.rank +
      " " +
      summoner.leaguePoints +
      "LP\n";
  }
  return formattedSummonersElo;
}

function removeUnrankedFromLeaderboard(summonersElo) {
  return summonersElo.filter((summonerElo) => summonerElo.leagueId);
}

async function getEloLeaderboard(number) {
  const summoners = await getAllSummonerMains();
  const summonersElo = await getAllSummonersElo(summoners);
  const summonersRankedElo = removeUnrankedFromLeaderboard(summonersElo);
  summonersRankedElo.sort(function (a, b) {
    return eloAsInt(b) - eloAsInt(a);
  });
  const firstNSummoners = summonersRankedElo.slice(0, number ? number : 10);
  return formatSummonersElo(firstNSummoners);
}

function getFillableColumnForRow(sheet, row, summonerName) {
  let i = apiGoogleUtils.SUMMONER_SHEET.SUMMONER_NAME_COLUMN_INDEX;
  while (
    sheet.sheets[apiGoogleUtils.SUMMONER_SHEET.INDEX].data[0].rowData[row]
      .values[i] &&
    sheet.sheets[apiGoogleUtils.SUMMONER_SHEET.INDEX].data[0].rowData[row]
      .values[i].formattedValue !== summonerName
  ) {
    i++;
  }
  return i;
}

async function addSummonerName(user, summonerName, server) {
  let sheet = await apiGoogle.getSheet();
  let row = apiGoogleUtils.getUserRow(sheet, user);
  if (row === -3) {
    await pronos.addPronostiqueur(user, server);
  }
  sheet = await apiGoogle.getSheet();
  row = apiGoogleUtils.getUserRow(sheet, user);
  const column = getFillableColumnForRow(sheet, row, summonerName);
  return addSummonerNameOnRowAndColumn(summonerName, row, column);
}

function addSummonerNameOnRowAndColumn(summonerName, row, column) {
  return apiGoogle.sendSummonerName(summonerName, row, column);
}

async function doesThisSummonerExistByName(summonerName) {
  const summoner = await riotApi.getSummonerBySummonerName(summonerName);
  return !!summoner.name;
}

async function getSummonerNamesByUserId(userId) {
  let summonerNames = [];
  const sheet = await apiGoogle.getSheet();
  let i = 3;
  while (sheet.sheets[apiGoogleUtils.PRONO_SHEET.INDEX].data[0].rowData[i]) {
    if (apiGoogleUtils.isUserRow(sheet, i)) {
      if (apiGoogleUtils.isSpecificUserRow(sheet, i, userId)) {
        let j = apiGoogleUtils.SUMMONER_SHEET.SUMMONER_NAME_COLUMN_INDEX;
        while (
          sheet.sheets[apiGoogleUtils.SUMMONER_SHEET.INDEX].data[0].rowData[i]
            .values[j]
        ) {
          summonerNames.push(
            sheet.sheets[apiGoogleUtils.SUMMONER_SHEET.INDEX].data[0].rowData[i]
              .values[j].formattedValue
          );
          j++;
        }
        return summonerNames;
      }
    }
    i++;
  }
}

async function getBestChampionImageURLBySummonerName(summonerName) {
  const summoner = await riotApi.getSummonerBySummonerName(summonerName);

  if (summoner.id) {
    const championMastery = await riotApi.getChampionMasteryBySummonerID(
      summoner.id
    );
    return await riotApi.getChampionImageURLByChampionID(
      championMastery[0].championId
    );
  }
  return ERROR_CODE.NO_SUMMONER;
}

async function getSoloLeagueBySummonerName(summonerName) {
  const summoner = await riotApi.getSummonerBySummonerName(summonerName);

  if (summoner.id) {
    const league = await riotApi.getLeagueBySummonerID(summoner.id);
    return getSoloQFromLeague(league);
  }
  return ERROR_CODE.NO_SUMMONER;
}

function getSoloQFromLeague(league) {
  if (league) {
    for (let i = 0; i < league.length; i++) {
      if (league[i].queueType === riotApiUtils.SOLOQ) {
        return league[i];
      }
    }
  }
  return ERROR_CODE.NO_RANKED;
}
