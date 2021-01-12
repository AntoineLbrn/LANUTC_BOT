module.exports = {
  PRONO_SHEET: {
    ID: 0,
    INDEX: 0,
    TAG_INDEX: 0,
    POINTS_INDEX: 1,
  },
  USER_SHEET: {
    INDEX: 1,
    ID: 472728378,
    TAG_INDEX: 0,
    IDS_INDEX: 1,
    SERVER_INDEX: 2,
    SERVER_ID_INDEX: 3,
    IS_ACTIVE_INDEX: 4,
    IS_ACTIVE_CODE: "1",
    IS_INACTIVE_CODE: "0",
  },
  SETTINGS_SHEET: {
    INDEX: 4,
    ID: 74604376,
    COMMAND_ID_INDEX: 0,
    COMMAND_ALIAS_INDEX: 1,
    FIRST_COMMAND_INDEX: 2,
  },
  SERVER_SHEET: {
    ID: 1216820103,
    INDEX: 2,
    SERVER_ID_INDEX: 0,
    SERVER_NAME_INDEX: 1,
    PRONOS_CHANNEL_NAME_INDEX: 2,
    PRONOS_CHANNEL_ID_INDEX: 3,
    PRONOS_ROLE_NAME_INDEX: 4,
    PRONOS_ROLE_ID_INDEX: 5,
  },
  SUMMONER_SHEET: {
    ID: 1892731136,
    INDEX: 3,
    SUMMONER_NAME_COLUMN_INDEX: 2,
    USER_ID_INDEX: 1,
  },

  isUserRow: isUserRow,
  isSpecificUserRow: isSpecificUserRow,
  getUserRow: getUserRow,
};

function isUserRow(sheet, userRow) {
  return (
    sheet.sheets[this.USER_SHEET.INDEX].data[0].rowData[userRow] &&
    sheet.sheets[this.USER_SHEET.INDEX].data[0].rowData[userRow].values[
      this.USER_SHEET.TAG_INDEX
    ] &&
    sheet.sheets[this.USER_SHEET.INDEX].data[0].rowData[userRow].values[
      this.USER_SHEET.TAG_INDEX
    ].formattedValue
  );
}

function isSpecificUserRow(sheet, userRow, userId) {
  return (
    sheet.sheets[this.USER_SHEET.INDEX].data[0].rowData[userRow].values[
      this.USER_SHEET.IDS_INDEX
    ].formattedValue === userId
  );
}

function getUserRow(sheet, user) {
  let i = 3;
  while (
    sheet.sheets[this.USER_SHEET.INDEX].data[0].rowData[i] &&
    sheet.sheets[this.USER_SHEET.INDEX].data[0].rowData[i].values[
      this.USER_SHEET.IDS_INDEX
    ]
  ) {
    if (
      sheet.sheets[this.USER_SHEET.INDEX].data[0].rowData[i].values[
        this.USER_SHEET.IDS_INDEX
      ].formattedValue === user.id
    ) {
      return i;
    }
    i++;
  }
  return -3;
}
