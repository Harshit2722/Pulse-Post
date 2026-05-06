import axios from "axios"

const API = axios.create({
    baseURL: "http://localhost:3001/api/v1",
    withCredentials: true
})


API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


const registerUser = (formData) => API.post('/users/register', formData);
const loginUser = (formData) => API.post('/users/login', formData);

const getCurrentUser = ()=> API.get('/users/me')

const createPost = (postData) => API.post("/posts/create",postData);

const fetchPosts = () => API.get("/posts");

const deletePost = (id) => API.delete(`/posts/${id}`);

const toggleLike = (id) => API.post(`/posts/${id}/like`);


export {registerUser,loginUser,getCurrentUser,createPost,fetchPosts,deletePost,toggleLike}
export default API