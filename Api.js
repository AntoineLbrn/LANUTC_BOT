var request = require('request');
var logger = require('winston');
const fetch = require("node-fetch");
const config = require('./config');

var TOKEN = null;

const MATCH_DAY_LINE_INDEX = 0
const TEAM_NAME_LINE_INDEX = 1
const FIRST_PRONOSTIQUEUR_LINE = 3;
const MAX_PRONOSTIQUEUR_STATS = 50;
module.exports = {
    getMatchesOfTheDay: async function () {
        const tomorrow = getTomorrow();
        return await getMatchesByDate(tomorrow);
    },
    fillPronos: async function (user, team1, team2, winner) {
        let result = null;
        const tomorrow = getTomorrow();
        const matches = await getMatchesByDate(tomorrow);
        matches.forEach(match => {
            if (match[0] === team1 && match[1] === team2) {
                result = addProno(tomorrow, match, winner, user);
            }
        });
        return result ? result : -2;
    },
    addPronostiqueur: async function (user) {
        const sheet = await getSheet();
        let i=3;
        while (sheet.sheets[0].data[0].rowData[i] && sheet.sheets[0].data[0].rowData[i].values[0].formattedValue) {
            if (sheet.sheets[0].data[0].rowData[i].values[0].formattedValue === user.tag) {
                return -1;
            }
            i++;
        }
        return sendPronostiqueur(user, i);
    },
    getLeaderboard: async function (params) {
        const leaderboard = await getAllUsersLeaderboard();
        return getBestPronostiqueurs(leaderboard, params);
    },
    getRanking: async function (user) {
        const leaderboard = await getAllUsersLeaderboard();
        return getSpecificPronostiqueur(leaderboard, user);
    },
    getStatisticsOfCurrentDay: async function() {
        const today = getToday();
        return await getMatchesStatisticsByDate(today);
    }
}

async function getSpecificPronostiqueur(leaderboard, user) {
    leaderboard.sort(function(a, b){return parseFloat(a[1]) - parseFloat(b[1])}).reverse();
    let i=0;
    for (i; i<leaderboard.length; i++) {
        if (leaderboard[i][0][0] === user.tag) {
            return "" + user.toString() + " - **Classement** : " + (i+1) + " - **Points** : " + leaderboard[i][1];
        }
    }
    return messages.NOT_A_PRONOSTIQUEUR
}
async function getAllUsersLeaderboard() {
    const leaderboard = []
    const sheet = await getSheet();
    let i=3;
    while (sheet.sheets[0].data[0].rowData[i] && sheet.sheets[0].data[0].rowData[i].values[0].formattedValue) {
        leaderboard.push([[sheet.sheets[0].data[0].rowData[i].values[0].formattedValue],
            [sheet.sheets[0].data[0].rowData[i].values[1].formattedValue]]);
        i++;
    }
    return leaderboard;
}

async function getBestPronostiqueurs(leaderboard, params) {
    leaderboard.sort(function(a, b){return parseFloat(a[1]) - parseFloat(b[1])}).reverse();
    if (params[1] && params[1] > 0  && params[1] < 11) {
        let leaderboardAsString = "";
        let i=1;
        for (i; i<= params[1]; i++) {
            leaderboardAsString +="**" + i + " :** " + leaderboard[i-1][0] + " " + leaderboard[i-1][1] + " points\n"
        }
        return leaderboardAsString;
    }
    return "**1er** : " + leaderboard[0][0] + " " + leaderboard[0][1] + " points\n" +
        "**2ème** : " + leaderboard[1][0] + " " + leaderboard[1][1] + " points\n" +
        "**3ème** : " + leaderboard[2][0] + " " + leaderboard[2][1] + " points";
}
async function sendPronostiqueur(user, row) {
    await getToken();
    const body = JSON.stringify({
        requests: [{
            repeatCell: {
                range: {
                    startColumnIndex: 0,
                    endColumnIndex: 1,
                    startRowIndex: row,
                    endRowIndex: row + 1,
                    sheetId: 0
                },
                cell: {
                    userEnteredValue: {
                        "stringValue": user.tag
                    },
                },
                fields: "*"
            }
        }]
    });
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.SHEET_ID}:batchUpdate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${TOKEN.access_token}`,
        },
        body: body
    });
    return response.status === 200 ? 0 : -2;
}
function getDayColumn(values, currentDate) {
    for (let i = 0; i < values.length; i++) {
        if (values[i].formattedValue === currentDate) {
            return i;
        }
    }
    return null;
}

function getNextDayColumn(values, currentDate) {
    let hasDayBeenFound = false;
    for (let i = 0; i < values.length; i++) {
        if (values[i].formattedValue === currentDate) {
            hasDayBeenFound = true;
        } else if (hasDayBeenFound && values[i].formattedValue) {
            return i;
        }
    }
    return null;
}

function getMatchColumn(sheet, date, match) {
    const matches = sheet.sheets[0].data[0].rowData;
    let dayColumnIndex = getDayColumn(matches[MATCH_DAY_LINE_INDEX].values, date);
    const nextDayColumnIndex = getNextDayColumn(matches[MATCH_DAY_LINE_INDEX].values, date);
    while (dayColumnIndex < nextDayColumnIndex) {
        if (matches[TEAM_NAME_LINE_INDEX].values[dayColumnIndex].formattedValue === match[0] &&
            matches[TEAM_NAME_LINE_INDEX].values[dayColumnIndex + 1].formattedValue === match[1]) {
            return dayColumnIndex;
        }
        dayColumnIndex+=2
    }
}

async function getUserRow(sheet, user) {
    let i = 3;
    while (sheet.sheets[0].data[0].rowData[i]) {
        if (sheet.sheets[0].data[0].rowData[i].values[0].formattedValue === user.tag) {
            return i;
        }
        i++;
    }
    return -3;
}

async function addProno(tomorrow, match, winner, user) {
    const sheet = await getSheet();

    const matchColumn = getMatchColumn(sheet, tomorrow, match);
    const playerRow = await getUserRow(sheet, user);
    if (playerRow === -3) {
        return -3;
    }
    if (hasPronoAlreadyBeenDoneForThisMatch(sheet, playerRow, matchColumn)) {
        return -1;
    }
    await getToken();

    const body = JSON.stringify({
        requests: [{
            repeatCell: {
                range: {
                    startColumnIndex: matchColumn + winner - 1,
                    endColumnIndex: matchColumn + winner,
                    startRowIndex: playerRow,
                    endRowIndex: playerRow + 1,
                    sheetId: 0
                },
                cell: {
                    userEnteredValue: {
                        "numberValue": 1
                    },
                },
                fields: "*"
            }
        }]
    });
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.SHEET_ID}:batchUpdate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${TOKEN.access_token}`,
        },
        body: body
    });
    return response.status === 200 ? 0 : -2
}

function hasPronoAlreadyBeenDoneForThisMatch(sheet, player, matchColumn) {
    return sheet.sheets[0].data[0].rowData[player].values[matchColumn] &&
        sheet.sheets[0].data[0].rowData[player].values[matchColumn].hasOwnProperty('formattedValue') ||
        sheet.sheets[0].data[0].rowData[player].values[matchColumn+1] &&
        sheet.sheets[0].data[0].rowData[player].values[matchColumn+1].hasOwnProperty('formattedValue');
}

async function getMatchesByDate(date) {
    let matchesAsArrayString = [];
    const sheet = await getSheet();
    const matches = sheet.sheets[0].data[0].rowData;
    let dayColumnIndex = getDayColumn(matches[MATCH_DAY_LINE_INDEX].values, date);
    const nextDayColumnIndex = getNextDayColumn(matches[MATCH_DAY_LINE_INDEX].values, date);
    while (dayColumnIndex < nextDayColumnIndex) {
        matchesAsArrayString.push(
            [
                matches[TEAM_NAME_LINE_INDEX].values[dayColumnIndex].formattedValue,
                matches[TEAM_NAME_LINE_INDEX].values[dayColumnIndex + 1].formattedValue
            ]);
        dayColumnIndex += 2;
    }
    return matchesAsArrayString;
}

function getMatchStatsticsAsString(matches, firstTeamColumn, secondTeamColumn) {
    let numberOfSample = 0;
    let total = 0;
    let i=FIRST_PRONOSTIQUEUR_LINE;
    for (i; i<MAX_PRONOSTIQUEUR_STATS; i++) {
        console.log(matches[i].values[firstTeamColumn]);
        if (matches[i].values[firstTeamColumn]) {
            if (matches[i].values[firstTeamColumn].formattedValue === '1') {
                total ++;
                numberOfSample++;
            } else if (matches[i].values[secondTeamColumn].formattedValue === '1') {
                numberOfSample++;
            }
        }
    }
    return matches[TEAM_NAME_LINE_INDEX].values[firstTeamColumn].formattedValue + " " +
        (total*100/numberOfSample).toFixed(2) + "% (" + total + ")" +
        " | " +
        matches[TEAM_NAME_LINE_INDEX].values[secondTeamColumn].formattedValue + " " +
        (100 - total*100/numberOfSample).toFixed(2) + "% (" + (numberOfSample - total) + ")";
}

async function getMatchesStatisticsByDate(date) {
    let matchesStatisticsAsString = "```fix\n";
    const sheet = await getSheet();
    const matches = sheet.sheets[0].data[0].rowData;
    let dayColumnIndex = getDayColumn(matches[MATCH_DAY_LINE_INDEX].values, date);
    const nextDayColumnIndex = getNextDayColumn(matches[MATCH_DAY_LINE_INDEX].values, date);
    while (dayColumnIndex < nextDayColumnIndex) {
        matchesStatisticsAsString += getMatchStatsticsAsString(matches, dayColumnIndex, dayColumnIndex +1) + "\n";
        dayColumnIndex += 2;
    }
    return matchesStatisticsAsString + "```";
}

async function getSheet() {
    await getToken();
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + config.SHEET_ID + '/?includeGridData=true', {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOKEN.access_token}`
        }
    });
    return await response.json();
}

function getTomorrow() {
    const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0'); //January is 0!
    return dd + '/' + mm;
}

function getToday() {
    const today = new Date(new Date().getTime());
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    return dd + '/' + mm;
}

async function getToken() {
    if (! TOKEN || TOKEN.refreshDate < Date.now() ) {
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: "grant_type=refresh_token&refresh_token=" + config.GOOGLE_API.REFRESH_TOKEN +
                "&client_id=" + config.GOOGLE_API.CLIENT_ID +
                "&client_secret=" + config.GOOGLE_API.CLIENT_SECRET
        });
        TOKEN = await response.json();
        const now = new Date();
        TOKEN.refreshDate = new Date();
        TOKEN.refreshDate.setTime(now.getTime() + (30*60*1000))
    }
    console.log(TOKEN);
}