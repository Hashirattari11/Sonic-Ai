const BASE_URL = window?.electronAPI?.baseUrl || 'http://127.0.0.1:8000';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('sonic-auth') 
    ? JSON.parse(localStorage.getItem('sonic-auth'))?.state?.user?.token 
    : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  auth: {
    signup: (data) => request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  },
  settings: {
    saveApiKey: (userId, apiKey, provider = 'openrouter') => request('/settings/api-key', { method: 'POST', body: JSON.stringify({ user_id: userId, api_key: apiKey, provider }) }),
    getApiKey: (userId, provider = '') => request(`/settings/api-key/${userId}${provider ? `?provider=${provider}` : ''}`),
  },
  chat: {
    sendMessage: (userId, conversationId, message) => request('/chat/message', { method: 'POST', body: JSON.stringify({ user_id: userId, conversation_id: conversationId, message }) }),
    getConversations: (userId) => request(`/chat/conversations/${userId}`),
    getMessages: (conversationId) => request(`/chat/messages/${conversationId}`),
    createConversation: (userId, title) => request('/chat/new', { method: 'POST', body: JSON.stringify({ user_id: userId, title: title || null }) }),
    deleteConversation: (conversationId) => request(`/chat/conversation/${conversationId}`, { method: 'DELETE' }),
  },
  memory: {
    get: (userId) => request(`/memory/${userId}`),
    save: (userId, key, value) => request(`/memory/${userId}`, { method: 'POST', body: JSON.stringify({ key, value }) }),
  },
  system: {
    getStats: () => request('/system/stats'),
  },
};
