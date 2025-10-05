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
const {
  getAllAdmins,
  getAdmin,
  createAdmin,
  updateAdmin,
  deleteAdmin
} = require('../controllers/adminController');
const { protectUser } = require('../middleware/auth');

// تمام route‌ها نیاز به احراز هویت دارند
router.use(protectUser);

// مسیرهای سایت
router.route('/')
  .get(getAllSites)
  .post(createSite);

router.route('/:id')
  .get(getSite)
  .put(updateSite)
  .delete(deleteSite);

router.get('/:id/scripts', getScripts);
router.put('/:id/settings', updateSettings);

// مسیرهای ادمین برای هر سایت
router.route('/:siteId/admins')
  .get(getAllAdmins)
  .post(createAdmin);

router.route('/:siteId/admins/:adminId')
  .get(getAdmin)
  .put(updateAdmin)
  .delete(deleteAdmin);

module.exports = router;