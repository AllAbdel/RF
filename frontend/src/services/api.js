import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

axios.defaults.baseURL = API_URL;

// Intercepteur pour ajouter le token à chaque requête
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Véhicules
export const vehicleAPI = {
  getAll: (params) => axios.get('/vehicles', { params }),
  getById: (id) => axios.get(`/vehicles/${id}`),
  getAgencyVehicles: () => axios.get('/vehicles/agency'),
  create: (formData) => axios.post('/vehicles', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => axios.put(`/vehicles/${id}`, data),
  delete: (id) => axios.delete(`/vehicles/${id}`),
  checkAvailability: (id, params) => axios.get(`/vehicles/${id}/availability`, { params })
};

// Réservations
export const reservationAPI = {
  create: (data) => axios.post('/reservations', data),
  getClientReservations: () => axios.get('/reservations/client'),
  getAgencyReservations: () => axios.get('/reservations/agency'),
  updateStatus: (id, status) => axios.put(`/reservations/${id}/status`, { status }),
  cancel: (id) => axios.put(`/reservations/${id}/cancel`),
  update: (id, data) => axios.put(`/reservations/${id}`, data)
};

// Messagerie
export const messageAPI = {
  getOrCreateConversation: (agencyId) => axios.post('/messages/conversation', { agency_id: agencyId }),
  getConversations: () => axios.get('/messages/conversations'),
  getMessages: (conversationId) => axios.get(`/messages/conversation/${conversationId}`),
  sendMessage: (data) => axios.post('/messages/send', data)
};

// Avis
export const reviewAPI = {
  create: (data) => axios.post('/review', data),
  getVehicleReviews: (vehicleId) => axios.get(`/reviews/${vehicleId}`)
};

// Notifications
export const notificationAPI = {
  getAll: () => axios.get('/notifications'),
  getUnreadCount: () => axios.get('/notifications/unread-count'),
  markAsRead: (id) => axios.put(`/notifications/${id}/read`),
  markAllAsRead: () => axios.put('/notifications/read-all')
};

// Agence
export const agencyAPI = {
  searchAgencies: (search) => axios.get('/agency/search', { params: { search } }),
  requestToJoin: (agency_id) => axios.post('/agency/join-request', { agency_id }),
  getJoinRequests: () => axios.get('/agency/join-requests'),
  handleJoinRequest: (request_id, action) => axios.post('/agency/join-requests/handle', { request_id, action }),
  getMembers: () => axios.get('/agency/members'),
  inviteMember: (data) => axios.post('/agency/members/invite', data),
  updateMemberRole: (memberId, role) => axios.put(`/agency/members/${memberId}/role`, { role }),
  promoteMember: (userId) => axios.post(`/agency/members/${userId}/promote`),
  removeMember: (memberId) => axios.delete(`/agency/members/${memberId}`),
  getStats: () => axios.get('/agency/stats'),
  getDetailedStats: () => axios.get('/agency/stats/detailed'),
  updateInfo: (data) => axios.put('/agency/info', data)
};

// Documents
export const documentAPI = {
  generateInvoice: (reservationId) => axios.post(`/documents/generate-invoice/${reservationId}`),
  generateReceipt: (reservationId) => axios.post(`/documents/generate-receipt/${reservationId}`),
  generateContract: (reservationId) => axios.post(`/documents/generate-contract/${reservationId}`),
  getDocuments: (reservationId) => axios.get(`/documents/reservation/${reservationId}`),
  signContract: (documentId, signatureData) => axios.post(`/documents/sign-contract/${documentId}`, { signature_data: signatureData }),
  download: (documentId) => axios.get(`/documents/download/${documentId}`, { responseType: 'blob' })
};

const api = {
  vehicleAPI,
  reservationAPI,
  messageAPI,
  reviewAPI,
  notificationAPI,
  agencyAPI,
  documentAPI
};

export default api;
