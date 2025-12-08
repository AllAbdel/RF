import React, { useState, useEffect } from 'react';
import { agencyAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/AgencyMembers.css';

const AgencyMembers = () => {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'member'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('AgencyMembers - user:', user);
    console.log('AgencyMembers - isSuperAdmin:', isSuperAdmin);
    loadMembers();
  }, [user]);

  const loadMembers = async () => {
    try {
      const response = await agencyAPI.getMembers();
      setMembers(response.data.members);
    } catch (error) {
      console.error('Erreur chargement membres:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await agencyAPI.inviteMember(formData);
      const invitationLink = response.data.invitation_link;
      
      // Afficher le lien d'invitation
      alert(
        `Invitation envoyée avec succès!\n\n` +
        `Copiez et envoyez ce lien à votre nouveau membre :\n\n` +
        `${invitationLink}\n\n` +
        `Ce lien expire dans 7 jours.`
      );
      
      // Copier automatiquement le lien
      navigator.clipboard.writeText(invitationLink).then(() => {
        console.log('Lien copié dans le presse-papiers');
      });

      setShowInviteForm(false);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'member'
      });
      loadMembers();
    } catch (error) {
      alert('Erreur lors de l\'invitation: ' + (error.response?.data?.error || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (memberId, newRole) => {
    if (window.confirm(`Êtes-vous sûr de vouloir changer le rôle de ce membre ?`)) {
      try {
        await agencyAPI.updateMemberRole(memberId, newRole);
        loadMembers();
      } catch (error) {
        alert('Erreur lors de la mise à jour du rôle');
      }
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      try {
        await agencyAPI.removeMember(memberId);
        loadMembers();
      } catch (error) {
        alert('Erreur lors de la suppression: ' + (error.response?.data?.error || 'Erreur inconnue'));
      }
    }
  };

  const handlePromoteMember = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir promouvoir ce membre en administrateur ?')) {
      try {
        await agencyAPI.promoteMember(userId);
        alert('Membre promu avec succès !');
        loadMembers();
      } catch (error) {
        alert('Erreur lors de la promotion: ' + (error.response?.data?.error || 'Erreur inconnue'));
      }
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: { text: 'Super Admin', class: 'role-super-admin' },
      admin: { text: 'Admin', class: 'role-admin' },
      member: { text: 'Membre', class: 'role-member' }
    };
    return badges[role] || badges.member;
  };

  return (
    <div className="agency-members">
      <div className="members-header">
        <h2>Gestion des membres</h2>
      </div>

      <div className="members-list">
        {members.map((member) => {
          const roleBadge = getRoleBadge(member.role);
          const isCurrentUser = member.id === user.id;
          console.log('Member:', member.first_name, 'role:', member.role, 'isCurrentUser:', isCurrentUser, 'isSuperAdmin:', isSuperAdmin);

          return (
            <div key={member.id} className="member-card">
              <div className="member-info">
                <div className="member-avatar">
                  {member.first_name[0]}{member.last_name[0]}
                </div>
                <div className="member-details">
                  <h3>
                    {member.first_name} {member.last_name}
                    {isCurrentUser && <span className="you-badge">(Vous)</span>}
                  </h3>
                  <p>{member.email}</p>
                  <p>{member.phone}</p>
                </div>
              </div>

              <div className="member-actions">
                <span className={`role-badge ${roleBadge.class}`}>
                  {roleBadge.text}
                </span>

                {isSuperAdmin && !isCurrentUser && (
                  <div className="action-buttons">
                    {member.role === 'member' && (
                      <button
                        className="promote-btn"
                        onClick={() => handlePromoteMember(member.id)}
                      >
                        ⬆️ Promouvoir en Admin
                      </button>
                    )}
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleUpdate(member.id, e.target.value)}
                      className="role-select"
                    >
                      <option value="member">Membre</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                )}

                {isAdmin && !isCurrentUser && (
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    Retirer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgencyMembers;
