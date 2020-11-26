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
};

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

async function addSummonerName(user, summonerName) {
  const sheet = await apiGoogle.getSheet();
  const row = apiGoogleUtils.getUserRow(sheet, user);
  const column = getFillableColumnForRow(sheet, row, summonerName);
  return addSummonerNameOnRowAndColumn(summonerName, row, column);
}

function addSummonerNameOnRowAndColumn(summonerName, row, column) {
  return apiGoogle.sendSummonerName(summonerName, row, column);
}

async function doesThisSummonerExistByName(summonerName) {
  const summoner = await riotApi.getSummonerBySummonerName(summonerName);
  return !!summoner;
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
