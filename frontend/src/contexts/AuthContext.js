import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Charger l'utilisateur uniquement au montage initial si un token existe
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        await loadUser();
      } else {
        setLoading(false);
      }
      setInitialized(true);
    };
    
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Seulement au montage

  // Mettre à jour le header Authorization quand le token change (après login)
  useEffect(() => {
    if (initialized && token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token, initialized]);

  const loadUser = async () => {
    try {
      const response = await axios.get('/auth/profile');
      setUser(response.data.user);
    } catch (error) {
      // Erreur 401 = token invalide ou expiré, nettoyer silencieusement
      // Ne pas afficher d'erreur en console pour les 401 (c'est normal si pas connecté)
      if (error.response?.status !== 401) {
        console.error('Erreur chargement utilisateur:', error);
      }
      // Nettoyer les tokens invalides sans appeler l'API de logout
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, userType, twoFactorToken = null) => {
    try {
      const payload = {
        email,
        password,
        user_type: userType
      };
      
      // Ajouter le code 2FA si fourni
      if (twoFactorToken) {
        payload.twoFactorToken = twoFactorToken;
      }
      
      const response = await axios.post('/auth/login', payload);
      
      // Cas 1: 2FA requis
      if (response.data.requires2FA) {
        return { 
          success: false, 
          requires2FA: true,
          message: 'Code 2FA requis'
        };
      }
      
      // Cas 2: Email non vérifié
      if (response.data.emailVerificationRequired) {
        return {
          success: false,
          emailVerificationRequired: true,
          message: 'Veuillez vérifier votre email avant de vous connecter'
        };
      }
      
      // Cas 3: Connexion réussie
      const { accessToken, refreshToken: newRefreshToken, user } = response.data;
      
      // Sauvegarder les tokens
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      setToken(accessToken);
      setRefreshToken(newRefreshToken);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur de connexion' 
      };
    }
  };

  const register = async (formData) => {
    try {
      const response = await axios.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Si vérification email requise
      if (response.data.emailVerificationRequired) {
        return {
          success: true,
          emailVerificationRequired: true,
          message: 'Veuillez vérifier votre email'
        };
      }
      
      const { accessToken, refreshToken: newRefreshToken, user } = response.data;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      setToken(accessToken);
      setRefreshToken(newRefreshToken);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur d\'inscription' 
      };
    }
  };

  const logout = async () => {
    try {
      // Appeler le logout serveur pour blacklister le token
      if (token) {
        await axios.post('/auth/logout');
      }
    } catch (error) {
      console.error('Erreur logout serveur:', error);
    } finally {
      // Nettoyer le localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    isClient: user?.user_type === 'client',
    isAgency: user?.user_type === 'agency_member',
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isSuperAdmin: user?.role === 'super_admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
