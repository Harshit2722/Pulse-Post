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


export {registerUser,loginUser}