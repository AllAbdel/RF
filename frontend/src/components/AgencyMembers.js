import React, { useState, useEffect } from 'react';
import { agencyAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/AgencyMembers.css';

const AgencyMembers = () => {
  const { user } = useAuth();
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
    loadMembers();
  }, []);

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
      alert(`Membre invité avec succès! Mot de passe temporaire: ${response.data.temp_password}`);
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
        <h2>👥 Gestion des membres</h2>
        {user.isAdmin && (
          <button className="invite-btn" onClick={() => setShowInviteForm(!showInviteForm)}>
            {showInviteForm ? 'Annuler' : '+ Inviter un membre'}
          </button>
        )}
      </div>

      {showInviteForm && (
        <div className="invite-form-container">
          <form onSubmit={handleInvite} className="invite-form">
            <h3>Inviter un nouveau membre</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Prénom *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Téléphone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Rôle</label>
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="member">Membre</option>
                {user.isSuperAdmin && <option value="admin">Admin</option>}
              </select>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Invitation en cours...' : 'Inviter'}
            </button>
          </form>
        </div>
      )}

      <div className="members-list">
        {members.map((member) => {
          const roleBadge = getRoleBadge(member.role);
          const isCurrentUser = member.id === user.id;

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

                {user.isSuperAdmin && !isCurrentUser && (
                  <div className="action-buttons">
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

                {user.isAdmin && !isCurrentUser && (
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    🗑️ Retirer
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
