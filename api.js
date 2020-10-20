const fetch = require("node-fetch");
const config = require('./configuration');
const messages = require('./messages.json');

var TOKEN = null;

const MATCH_DAY_LINE_INDEX = 0
const TEAM_NAME_LINE_INDEX = 1
const FIRST_PRONOSTIQUEUR_LINE = 3;
const MAX_PRONOSTIQUEUR_STATS = 50;
module.exports = {
    getRank: async function(user) {
        const leaderboard = await getAllUsersLeaderboard();
        return getSpecificPronostiqueur(leaderboard, user);
    },
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
                result = addBO1Prono(tomorrow, match, winner, user);
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
    getStatisticsOfCurrentDay: async function() {
        const today = getToday();
        return await getMatchesStatisticsByDate(today);
    },
    getStatisticsOfCurrentDayBO5: async function() {
        const today = getToday();
        return await getMatchesStatisticsByDateBO5(today);
    },
    fillBO5Pronos: async function(user, winningTeam, losingTeam, score) {
        let result;
        const tomorrow = getTomorrow();
        const matches = await getMatchesByDate(tomorrow);
        matches.forEach(match => {
            if (match[0] === losingTeam && match[1] === winningTeam) {
                result = addBO5Prono(tomorrow, match, user, score, false);
            } else if (match[0] === winningTeam && match[1] === losingTeam) {
                result = addBO5Prono(tomorrow, match, user, score, true);
            }

        });
        return result ? result : -2;
    }
};

async function getSpecificPronostiqueur(leaderboard, user) {
    leaderboard.sort(function(a, b){return parseFloat(a[1]) - parseFloat(b[1])}).reverse();
    let i=0;
    for (i; i<leaderboard.length; i++) {
        if (leaderboard[i][0][0] === user.tag) {
            return [i+1,leaderboard[i][1][0]];
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

async function sendProno(column, row, value, sheet) {
    if (row === -3) {
        return -3;
    }
    if (hasPronoAlreadyBeenDoneForThisMatch(sheet, row, column)) {
        return -1;
    }
    await getToken();
    const body = JSON.stringify({
        requests: [{
            repeatCell: {
                range: {
                    startColumnIndex: column,
                    endColumnIndex: column + 1,
                    startRowIndex: row,
                    endRowIndex: row + 1,
                    sheetId: 0
                },
                cell: {
                    userEnteredValue: {
                        "numberValue": value,
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

async function addBO5Prono(tomorrow, match, user, score, winnerIsFirstTeam) {
    const sheet = await getSheet();
    const matchColumn = getMatchColumn(sheet, tomorrow, match);
    const playerRow = await getUserRow(sheet, user);

    const requestOnFirstColumn = await sendProno(matchColumn, playerRow, winnerIsFirstTeam ? 3 : score, sheet);
    const requestOnSecondColumn = await sendProno(matchColumn+1, playerRow, winnerIsFirstTeam ? score : 3, sheet);
    return requestOnFirstColumn === 0 && requestOnSecondColumn === 0 ? 0 : requestOnSecondColumn;
}

async function addBO1Prono(tomorrow, match, winner, user) {
    const sheet = await getSheet();
    const matchColumn = getMatchColumn(sheet, tomorrow, match);
    const playerRow = await getUserRow(sheet, user);

    return sendProno(matchColumn + winner - 1, playerRow, 1, sheet);
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

function getMatchStatsticsAsStringBO5(matches, firstTeamColumn) {
    let votesForFirstTeam = [];
    let votesForSecondTeam = [];
    let i=FIRST_PRONOSTIQUEUR_LINE;
    let numberOfSample = 0;
    for (i; i<MAX_PRONOSTIQUEUR_STATS; i++) {
        if (matches[i].values[firstTeamColumn]) {
            if (matches[i].values[firstTeamColumn].formattedValue !== null) {
                numberOfSample++;
                if (matches[i].values[firstTeamColumn].formattedValue > matches[i].values[firstTeamColumn +1].formattedValue) {
                    votesForFirstTeam.push(
                        [matches[i].values[firstTeamColumn].formattedValue + "-" + matches[i].values[firstTeamColumn + 1].formattedValue]);
                } else if (matches[i].values[firstTeamColumn].formattedValue < matches[i].values[firstTeamColumn +1].formattedValue) {
                    votesForSecondTeam.push(
                        [matches[i].values[firstTeamColumn+1].formattedValue + "-" + matches[i].values[firstTeamColumn].formattedValue]);
                }
            }
        }
    }
    const votesForFirstTeamAsString =
        "Votes pour " + matches[TEAM_NAME_LINE_INDEX].values[firstTeamColumn].formattedValue +
        " : " + (votesForFirstTeam.length*100 /numberOfSample).toFixed(2) + "%"+
        " (" + (votesForFirstTeam.length) + ")";
    const votesForSecondTeamAsString =
        "Votes pour " + matches[TEAM_NAME_LINE_INDEX].values[firstTeamColumn+1].formattedValue +
        " : " + (votesForSecondTeam.length*100 /numberOfSample).toFixed(2) + "%"+
        " (" + (votesForSecondTeam.length) + ")";

    const frequencyForFirstTeamAsString = getVotesFrequencies(votesForFirstTeam);
    const frequencyForSecondTeamAsString = getVotesFrequencies(votesForSecondTeam);

    return votesForFirstTeamAsString + "\n" + frequencyForFirstTeamAsString + '\n\n' +
        votesForSecondTeamAsString +  '\n' + frequencyForSecondTeamAsString;
}

function getVotesFrequencies(votesList) {
    const frequencyForFirstTeam = votesList.reduce(groupBy, {});
    const keys = Object.keys(frequencyForFirstTeam);
    return keys.map(key => {
        return key + " : " + (frequencyForFirstTeam[key]*100/votesList.length).toFixed(2) + "% (" + frequencyForFirstTeam[key] + ")";
    }).join('\n');
}
function groupBy (acc, curr) {
    if (typeof acc[curr] == 'undefined') {
        acc[curr] = 1;
    } else {
        acc[curr] += 1;
    }

    return acc;
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

async function getMatchesStatisticsByDateBO5(date) {
    let matchesStatisticsAsString = "```fix\n";
    const sheet = await getSheet();
    const matches = sheet.sheets[0].data[0].rowData;
    let dayColumnIndex = getDayColumn(matches[MATCH_DAY_LINE_INDEX].values, date);
    const nextDayColumnIndex = getNextDayColumn(matches[MATCH_DAY_LINE_INDEX].values, date);
    while (dayColumnIndex < nextDayColumnIndex) {
        matchesStatisticsAsString += getMatchStatsticsAsStringBO5(matches, dayColumnIndex) + "\n";
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
        console.log(TOKEN);
    }
}