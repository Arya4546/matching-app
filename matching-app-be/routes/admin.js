const express = require('express');
const { adminAuth } = require('../middleware/auth');
const {
  listUsers,
  setFrozenStatus,
  updateUserBasicStatus,
  listUsersValidation,
  freezeValidation,
  updateStatusValidation,
} = require('../controllers/adminController');

const router = express.Router();

router.get('/users', adminAuth, listUsersValidation, listUsers);
router.patch('/users/:userId/freeze', adminAuth, freezeValidation, setFrozenStatus);
router.patch('/users/:userId/status', adminAuth, updateStatusValidation, updateUserBasicStatus);

module.exports = router;
