const mongoose = require('mongoose');
const Site = require('../models/Site');

const resolveSiteByIdentifier = async (identifier) => {
  if (!identifier) {
    return null;
  }

  let site = null;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    site = await Site.findById(identifier);
    if (site) {
      return site;
    }
  }

  return Site.findOne({ token: identifier });
};

module.exports = {
  resolveSiteByIdentifier,
};
