import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../utils/axios';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [socket, setSocket] = useState(null);
    const [loading, setLoading] = useState(true);


       // This is our helper to connect the socket
    const connectSocket = (token) => {
        const newSocket = io('http://localhost:3001', {
            auth: { token }
        });
        setSocket(newSocket);
    };

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        setUser(userData);
        connectSocket(token); 
    };
    
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        socket?.disconnect();
        setSocket(null);
    };

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const { data } = await getCurrentUser();
                setUser(data.data);

                connectSocket(token);


            } catch (err) {
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        checkAuth();
        return () => socket?.close();
    }, []);

    

    return (
        <AuthContext.Provider value={{ user, setUser, socket, loading, logout, login }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
