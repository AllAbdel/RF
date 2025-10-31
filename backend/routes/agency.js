const express = require('express');
const router = express.Router();
const {
  getAgencyMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  getAgencyStats,
  updateAgencyInfo
} = require('../controllers/agencyController');
const { authMiddleware, isAgencyMember, isAgencyAdmin, isSuperAdmin } = require('../middleware/auth');

router.get('/members', authMiddleware, isAgencyMember, getAgencyMembers);
router.post('/members/invite', authMiddleware, isAgencyAdmin, inviteMember);
router.put('/members/:member_id/role', authMiddleware, isSuperAdmin, updateMemberRole);
router.delete('/members/:member_id', authMiddleware, isAgencyAdmin, removeMember);
router.get('/stats', authMiddleware, isAgencyMember, getAgencyStats);
router.put('/info', authMiddleware, isAgencyAdmin, updateAgencyInfo);

module.exports = router;
