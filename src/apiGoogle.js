const config = require("../config/configuration");
const fetch = require("node-fetch");
var TOKEN = null;

module.exports = {
  sendPronostiqueur: sendPronostiqueur,
  sendProno: sendProno,
  getSheet: getSheet,
};

async function sendPronostiqueur(user, row) {
  await getToken();
  const body = JSON.stringify({
    requests: [
      {
        repeatCell: {
          range: {
            startColumnIndex: 0,
            endColumnIndex: 1,
            startRowIndex: row,
            endRowIndex: row + 1,
            sheetId: 0,
          },
          cell: {
            userEnteredValue: {
              stringValue: user.tag,
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
