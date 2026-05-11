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
const loginUser = (formData) => API.post('/users/login', formData);
const googleLogin = (idToken) => API.post('/users/google-login', { idToken });

const getCurrentUser = () => API.get('/users/me')

const createPost = (postData) => API.post("/posts/create", postData);

const fetchPosts = () => API.get("/posts");

const fetchPostById = (id) => API.get(`/posts/${id}`);

const deletePost = (id) => API.delete(`/posts/${id}`);

const toggleLike = (id) => API.post(`/posts/${id}/like`);

const updateAccount = (data) => API.patch("/users/update-account", data);

const addComment = (id, content) => API.post(`/posts/${id}/comment`, { content });

const deleteComment = (postId, commentId) => API.delete(`/posts/${postId}/comment/${commentId}`);

const updateAvatar = (formData) => API.patch('/users/update-avatar', formData);

const editPost = (id, data) => API.patch(`/posts/${id}`, data);

const fetchNotifications = () => API.get('/notifications');
const deleteNotification = (id) => API.delete(`/notifications/${id}`);

const savePulse = (postId) => API.post(`/users/save/${postId}`);
const fetchSavedPulses = () => API.get('/users/saved');

export { 
    registerUser, loginUser, getCurrentUser, createPost, fetchPosts, deletePost, 
    toggleLike, updateAccount, addComment, deleteComment, googleLogin, updateAvatar, 
    fetchPostById, fetchNotifications, deleteNotification, editPost, savePulse, fetchSavedPulses
}
export default API