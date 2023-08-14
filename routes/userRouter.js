const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/signup').post(authController.signup);
router.route('/signup/:token').get(authController.confirmSignUp);
router.route('/login').post(authController.login);
router.route('/logout').get(authController.logout);
router.route('/forgotPassword').post(authController.forgotPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);
router.route('/me').get(authController.protect, userController.getUser);
router
  .route('/deleteMe')
  .delete(authController.protect, userController.deleteMe);
router
  .route('/updateMe')
  .patch(authController.protect, userController.updateMe);
router
  .route('/updatePassword')
  .patch(authController.protect, authController.updatePassword);

module.exports = router;
