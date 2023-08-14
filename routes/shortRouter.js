const express = require('express');
const shortController = require('../controllers/shortController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(authController.protect, shortController.getShorts)
  .post(authController.isLoggedIn, shortController.createShort);

router.route('/stat').get(authController.protect, shortController.getStat);
router
  .route('/stat/:shortId')
  .get(authController.protect, shortController.getStatShort);

router
  .route('/:generated')
  .get(shortController.goLink)
  .delete(authController.protect, shortController.deleteShort);

module.exports = router;
