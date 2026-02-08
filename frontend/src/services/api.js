import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

axios.defaults.baseURL = API_URL;

// Variable pour éviter les boucles infinies de refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Intercepteur pour ajouter le token à chaque requête
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Debug: afficher les premiers caractères du token
      console.log('🔑 Request to:', config.url, '- Token:', token.substring(0, 30) + '...');
    } else {
      console.log('⚠️ Request to:', config.url, '- No token in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Endpoints qui ne doivent pas déclencher de refresh ou de redirection
const noRefreshEndpoints = ['/auth/profile', '/auth/refresh-token', '/auth/login', '/auth/register'];

// Vérifier si l'URL correspond à un endpoint sans refresh
const isNoRefreshEndpoint = (url) => {
  return noRefreshEndpoints.some(endpoint => url?.includes(endpoint));
};

// Intercepteur pour gérer le refresh automatique des tokens
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si erreur 401 et pas déjà en train de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Ne pas tenter de refresh pour les endpoints d'authentification
      // Cela évite les erreurs en console quand l'utilisateur n'est pas connecté
      if (isNoRefreshEndpoint(originalRequest.url)) {
        return Promise.reject(error);
      }
      
      // Si déjà en train de refresh, mettre en queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return axios(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // Pas de refresh token, nettoyer et rejeter silencieusement
        isRefreshing = false;
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        return Promise.reject(error);
      }

      try {
        // Tenter de refresh le token
        const response = await axios.post('/auth/refresh-token', {
          refreshToken: refreshToken
        });

        const { accessToken } = response.data;
        
        // Sauvegarder le nouveau token
        localStorage.setItem('token', accessToken);
        
        // Mettre à jour l'header de la requête originale
        originalRequest.headers.Authorization = 'Bearer ' + accessToken;
        
        // Traiter la queue
        processQueue(null, accessToken);
        
        isRefreshing = false;
        
        // Réessayer la requête originale
        return axios(originalRequest);
        
      } catch (refreshError) {
        // Refresh a échoué, nettoyer
        processQueue(refreshError, null);
        isRefreshing = false;
        
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Ne rediriger que si on n'est pas déjà sur la page d'auth
        if (!window.location.pathname.includes('/auth')) {
          window.location.href = '/auth';
        }
        
        return Promise.reject(refreshError);
      }
    }

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
  update: (id, data) => axios.put(`/vehicles/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
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
  sendMessage: (data) => axios.post('/messages/send', data),
  deleteMessage: (messageId) => axios.delete(`/messages/${messageId}`)
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
  getDetailedStats: (period = 'all') => axios.get('/agency/stats/detailed', { params: { period } }),
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

// Documents clients (validation)
export const clientDocumentAPI = {
  upload: (formData) => axios.post('/client-documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMyDocuments: () => axios.get('/client-documents/my-documents'),
  getPending: () => axios.get('/client-documents/pending'),
  validate: (documentId, action, notes) => axios.put(`/client-documents/${documentId}/validate`, { action, notes }),
  download: (documentId) => axios.get(`/client-documents/${documentId}/download`, { responseType: 'blob' })
};

const api = {
  vehicleAPI,
  reservationAPI,
  messageAPI,
  reviewAPI,
  notificationAPI,
  agencyAPI,
  documentAPI,
  clientDocumentAPI
};

export default api;
