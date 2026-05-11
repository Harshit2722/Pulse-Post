import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true
});

// Add token to requests
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const registerUser = (formData) => API.post('/users/register', formData);
const verifyOtp = (data) => API.post('/users/verify-otp', data);
const resendOtp = (data) => API.post('/users/resend-otp', data);
const loginUser = (formData) => API.post('/users/login', formData);
const googleLogin = (idToken) => API.post('/users/google-login', { idToken });
const forgotPasswordRequest = (email) => API.post('/users/forgot-password', { email });
const verifyForgotPasswordOtp = (data) => API.post('/users/verify-forgot-password-otp', data);
const resetPassword = (data) => API.post('/users/reset-password', data);

const getCurrentUser = () => API.get('/users/me')

const createPost = (postData) => API.post("/posts/create", postData);

const fetchPosts = (cursor = '', category = '') => {
    const params = new URLSearchParams();
    if (cursor && cursor !== 'null') params.append('cursor', cursor);
    if (category && category !== 'All') params.append('category', category);
    
    const queryString = params.toString();
    return API.get(`/posts${queryString ? `?${queryString}` : ''}`);
};

const fetchPostById = (id) => API.get(`/posts/${id}`);

const deletePost = (id) => API.delete(`/posts/${id}`);

const toggleLike = (id) => API.post(`/posts/${id}/like`);

const updateAccount = (data) => API.patch("/users/update-account", data);

const addComment = (id, content) => API.post(`/posts/${id}/comment`, { content });

const deleteComment = (postId, commentId) => API.delete(`/posts/${postId}/comment/${commentId}`);

const updateAvatar = (formData) => API.patch('/users/update-avatar', formData);

const removeAvatar = () => API.delete("/users/remove-avatar");

const editPost = (id, data) => API.patch(`/posts/${id}`, data);

const fetchNotifications = () => API.get('/notifications');
const deleteNotification = (id) => API.delete(`/notifications/${id}`);
const clearAllNotifications = () => API.delete('/notifications/clear-all/all');

const savePulse = (postId) => API.post(`/users/save/${postId}`);
const fetchSavedPulses = (cursor = '') => API.get(`/users/saved${cursor ? `?cursor=${cursor}` : ''}`);

const fetchMyPosts = (cursor = '') => API.get(`/posts/my-posts${cursor ? `?cursor=${cursor}` : ''}`);

export { 
    registerUser, verifyOtp, resendOtp, loginUser, getCurrentUser, createPost, fetchPosts, deletePost, 
    toggleLike, updateAccount, addComment, deleteComment, googleLogin, updateAvatar, removeAvatar,
    fetchPostById, fetchNotifications, deleteNotification, clearAllNotifications, editPost, savePulse, fetchSavedPulses,
    fetchMyPosts, forgotPasswordRequest, verifyForgotPasswordOtp, resetPassword
}
export default API