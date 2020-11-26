var tweetsPosted = [];

module.exports = {
  addTwitterLinkIfNotExist: addTwitterLinkIfNotExist,
  LINK_ALREADY_EXISTS: -1,
};

async function addTwitterLinkIfNotExist(user, link) {
  if (linkAlreadyExists(link)) {
    return this.LINK_ALREADY_EXISTS;
  } else {
    tweetsPosted.push(link);
  }
}

function linkAlreadyExists(link) {
  return tweetsPosted.indexOf(link) > -1;
}
