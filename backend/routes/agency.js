const express = require('express');
const router = express.Router();
const {
  searchAgencies,
  requestToJoinAgency,
  getPendingJoinRequests,
  handleJoinRequest,
  getAgencyMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  getAgencyStats,
  updateAgencyInfo,
  verifyInvitation,
  acceptInvitation,
  getPendingInvitations
} = require('../controllers/agencyController');
const { authMiddleware, isAgencyMember, isAgencyAdmin, isSuperAdmin } = require('../middleware/auth');

// Routes publiques pour rejoindre une agence
router.get('/search', searchAgencies);
router.post('/join-request', authMiddleware, requestToJoinAgency);

// Routes pour gérer les demandes d'adhésion (admin/super_admin seulement)
router.get('/join-requests', authMiddleware, isAgencyAdmin, getPendingJoinRequests);
router.post('/join-requests/handle', authMiddleware, isAgencyAdmin, handleJoinRequest);

router.get('/members', authMiddleware, isAgencyMember, getAgencyMembers);
router.post('/members/invite', authMiddleware, isAgencyAdmin, inviteMember);
router.put('/members/:member_id/role', authMiddleware, isSuperAdmin, updateMemberRole);
router.delete('/members/:member_id', authMiddleware, isAgencyAdmin, removeMember);
router.get('/stats', authMiddleware, isAgencyMember, getAgencyStats);
router.put('/info', authMiddleware, isAgencyAdmin, updateAgencyInfo);

// Routes d'invitation (publiques)
router.get('/invitation/:token/verify', verifyInvitation);
router.post('/invitation/:token/accept', acceptInvitation);
router.get('/invitations/pending', authMiddleware, isAgencyAdmin, getPendingInvitations);

module.exports = router;
