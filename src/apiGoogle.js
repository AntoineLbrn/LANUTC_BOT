const config = require("../config/configuration");
const apiGoogleUtils = require("../utils/apiGoogleUtils");
const fetch = require("node-fetch");
var TOKEN = null;

module.exports = {
  sendPronostiqueur: sendPronostiqueur,
  sendProno: sendProno,
  getSheet: getSheet,
  unsubscribeUser: unsubscribeUser,
  sendSettings: sendSettings,
  sendSummonerName: sendSummonerName,
};

async function sendSummonerName(summonerName, row, column) {
  await getToken();

  return (await updateCell(
    apiGoogleUtils.SUMMONER_SHEET.ID,
    column,
    row,
    summonerName
  )) === 0
    ? 0
    : -2;
}

async function sendSettings(botSetUp, row) {
  await getToken();

  const updateServerId = await updateCell(
    apiGoogleUtils.SERVER_SHEET.ID,
    apiGoogleUtils.SERVER_SHEET.SERVER_ID_INDEX,
    row,
    botSetUp.server.id
  );

  const updateServerName = await updateCell(
    apiGoogleUtils.SERVER_SHEET.ID,
    apiGoogleUtils.SERVER_SHEET.SERVER_NAME_INDEX,
    row,
    botSetUp.server.name
  );

  const updatePronosChannelName = await updateCell(
    apiGoogleUtils.SERVER_SHEET.ID,
    apiGoogleUtils.SERVER_SHEET.PRONOS_CHANNEL_NAME_INDEX,
    row,
    botSetUp.pronosChannel.name
  );

  const updatePronosChannelId = await updateCell(
    apiGoogleUtils.SERVER_SHEET.ID,
    apiGoogleUtils.SERVER_SHEET.PRONOS_CHANNEL_ID_INDEX,
    row,
    botSetUp.pronosChannel.id
  );

  const updatePronosRoleName = await updateCell(
    apiGoogleUtils.SERVER_SHEET.ID,
    apiGoogleUtils.SERVER_SHEET.PRONOS_ROLE_NAME_INDEX,
    row,
    botSetUp.pronosRole.name
  );

  const updatePronosRoleId = await updateCell(
    apiGoogleUtils.SERVER_SHEET.ID,
    apiGoogleUtils.SERVER_SHEET.PRONOS_ROLE_ID_INDEX,
    row,
    botSetUp.pronosRole.id
  );

  return updatePronosChannelId +
    updatePronosChannelName +
    updatePronosRoleId +
    updatePronosRoleName +
    updateServerId +
    updateServerName ===
    0
    ? 0
    : -2;
}

async function unsubscribeUser(row) {
  return await updateCell(
    apiGoogleUtils.USER_SHEET.ID,
    apiGoogleUtils.USER_SHEET.IS_ACTIVE_INDEX,
    row,
    apiGoogleUtils.USER_SHEET.IS_INACTIVE_CODE
  );
}
async function sendPronostiqueur(user, row, server) {
  await getToken();

  //send user tag
  const updateUserTagStatus = await updateCell(
    apiGoogleUtils.PRONO_SHEET.ID,
    apiGoogleUtils.PRONO_SHEET.TAG_INDEX,
    row,
    user.tag
  );
  //send user id
  const updateUserIdStatus = await updateCell(
    apiGoogleUtils.USER_SHEET.ID,
    apiGoogleUtils.USER_SHEET.IDS_INDEX,
    row,
    user.id
  );
  //send server name
  const updateServerNameStatus = await updateCell(
    apiGoogleUtils.USER_SHEET.ID,
    apiGoogleUtils.USER_SHEET.SERVER_INDEX,
    row,
    server.name
  );
  //send serverID
  const updateServerIdStatus = await updateCell(
    apiGoogleUtils.USER_SHEET.ID,
    apiGoogleUtils.USER_SHEET.SERVER_ID_INDEX,
    row,
    server.id
  );
  //set active code
  const updateActiveUserStatus = await updateCell(
    apiGoogleUtils.USER_SHEET.ID,
    apiGoogleUtils.USER_SHEET.IS_ACTIVE_INDEX,
    row,
    apiGoogleUtils.USER_SHEET.IS_ACTIVE_CODE
  );

  return updateActiveUserStatus +
    updateServerIdStatus +
    updateServerNameStatus +
    updateUserIdStatus +
    updateUserTagStatus ===
    0
    ? 0
    : -2;
}

async function sendProno(column, row, value, sheet) {
  if (row === -3) {
    return -3;
  }
  if (hasPronoAlreadyBeenDoneForThisMatch(sheet, row, column)) {
    return -1;
  }
  await getToken();
  const body = JSON.stringify({
    requests: [
      {
        repeatCell: {
          range: {
            startColumnIndex: column,
            endColumnIndex: column + 1,
            startRowIndex: row,
            endRowIndex: row + 1,
            sheetId: 0,
          },
          cell: {
            userEnteredValue: {
              numberValue: value,
            },
          },
          fields: "*",
        },
      },
    ],
  });
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.SHEET_ID}:batchUpdate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN.access_token}`,
      },
      body: body,
    }
  );
  return response.status === 200 ? 0 : -2;
}

async function updateCell(sheetId, column, row, value) {
  const body = JSON.stringify({
    requests: [
      {
        repeatCell: {
          range: {
            startColumnIndex: column,
            endColumnIndex: column + 1,
            startRowIndex: row,
            endRowIndex: row + 1,
            sheetId: sheetId,
          },
          cell: {
            userEnteredValue: {
              stringValue: value,
            },
          },
          fields: "*",
        },
      },
    ],
  });
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.SHEET_ID}:batchUpdate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN.access_token}`,
      },
      body: body,
    }
  );
  return response.status === 200 ? 0 : -2;
}

function hasPronoAlreadyBeenDoneForThisMatch(sheet, player, matchColumn) {
  return (
    (sheet.sheets[0].data[0].rowData[player].values[matchColumn] &&
      Object.prototype.hasOwnProperty.call(
        sheet.sheets[0].data[0].rowData[player].values[matchColumn],
        "formattedValue"
      )) ||
    (sheet.sheets[0].data[0].rowData[player].values[matchColumn + 1] &&
      Object.prototype.hasOwnProperty.call(
        sheet.sheets[0].data[0].rowData[player].values[matchColumn + 1],
        "formattedValue"
      ))
  );
}

async function getSheet() {
  await getToken();
  const response = await fetch(
    "https://sheets.googleapis.com/v4/spreadsheets/" +
      config.SHEET_ID +
      "/?includeGridData=true",
    {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN.access_token}`,
      },
    }
  );
  return await response.json();
}

async function getToken() {
  if (!TOKEN || TOKEN.refreshDate < Date.now()) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body:
        "grant_type=refresh_token&refresh_token=" +
        config.GOOGLE_API.REFRESH_TOKEN +
        "&client_id=" +
        config.GOOGLE_API.CLIENT_ID +
        "&client_secret=" +
        config.GOOGLE_API.CLIENT_SECRET,
    });
    TOKEN = await response.json();
    const now = new Date();
    TOKEN.refreshDate = new Date();
    TOKEN.refreshDate.setTime(now.getTime() + 30 * 60 * 1000);
    console.log(TOKEN);
  }
}
