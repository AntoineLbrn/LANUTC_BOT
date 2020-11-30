const config = require("../config/configuration");
const fetch = require("node-fetch");
const riotApiUtils = require("../utils/riotApiUtils");

module.exports = {
  getSummonerBySummonerName: getSummonerBySummonerName,
  getLeagueBySummonerID: getLeagueBySummonerID,
  getChampionMasteryBySummonerID: getChampionMasteryBySummonerID,
  getChampionImageURLByChampionID: getChampionImageURLByChampionID,
};

async function getChampionImageURLByChampionID(championID) {
  const patchesJson = await fetch(riotApiUtils.PATCHES_URL, {
    method: "GET",
  });
  const patches = await patchesJson.json();
  const currentPatch = patches[0];
  const championListJson = await fetch(
    riotApiUtils.CHAMPION_LIST_URL_1 +
      currentPatch +
      riotApiUtils.CHAMPION_LIST_URL_2,
    {
      method: "GET",
    }
  );
  const championList = await championListJson.json();
  for (let champion in championList.data) {
    if (championList.data[champion].key === championID + "") {
      return (
        riotApiUtils.CHAMPION_IMAGE_URL_1 +
        currentPatch +
        riotApiUtils.CHAMPION_IMAGE_URL_2 +
        championList.data[champion].id +
        riotApiUtils.CHAMPION_IMAGE_EXTENSION
      );
    }
  }
  return null;
}

async function requestRiotApiGet(url) {
  const response = await fetch(riotApiUtils.BASE_URL + url, {
    method: "GET",
    headers: {
      "X-Riot-Token": config.API_RIOT_KEY,
    },
  });
  console.log(response);
  return await response.json();
}
async function getChampionMasteryBySummonerID(summonerID) {
  return await requestRiotApiGet(
    riotApiUtils.CHAMPION_MASTERY.BY_SUMMONER_ID + summonerID
  );
}

async function getSummonerBySummonerName(summonerName) {
  return await requestRiotApiGet(
    riotApiUtils.SUMMONER.BY_NAME + encodeURIComponent(summonerName)
  );
}

async function getLeagueBySummonerID(summonerID) {
  return await requestRiotApiGet(
    riotApiUtils.LEAGUE.BY_SUMMONER_ID + summonerID
  );
}
