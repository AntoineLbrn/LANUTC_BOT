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

async function getChampionMasteryBySummonerID(summonerID) {
  const championMastery = await fetch(
    riotApiUtils.BASE_URL +
      riotApiUtils.CHAMPION_MASTERY.BY_SUMMONER_ID +
      summonerID,
    {
      method: "GET",
      headers: {
        "X-Riot-Token": config.API_RIOT_KEY,
      },
    }
  );
  return await championMastery.json();
}

async function getSummonerBySummonerName(summonerName) {
  const summoner = await fetch(
    riotApiUtils.BASE_URL +
      riotApiUtils.SUMMONER.BY_NAME +
      encodeURIComponent(summonerName),
    {
      method: "GET",
      headers: {
        "X-Riot-Token": config.API_RIOT_KEY,
      },
    }
  );
  return await summoner.json();
}

async function getLeagueBySummonerID(summonerID) {
  const summoner = await fetch(
    riotApiUtils.BASE_URL + riotApiUtils.LEAGUE.BY_SUMMONER_ID + summonerID,
    {
      method: "GET",
      headers: {
        "X-Riot-Token": config.API_RIOT_KEY,
      },
    }
  );
  return await summoner.json();
}
