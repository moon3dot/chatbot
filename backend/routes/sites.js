const express = require('express');
const router = express.Router();
const {
  getAllSites,
  getSite,
  createSite,
  updateSite,
  deleteSite,
  getScripts,
  updateSettings
} = require('../controllers/siteController');
const { protectUser } = require('../middleware/auth');

// تمام route‌ها نیاز به احراز هویت دارند
router.use(protectUser);

router.route('/')
  .get(getAllSites)
  .post(createSite);

router.route('/:id')
  .get(getSite)
  .put(updateSite)
  .delete(deleteSite);

router.get('/:id/scripts', getScripts);
router.put('/:id/settings', updateSettings);

module.exports = router;