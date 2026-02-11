import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    const res = await api.get('/auth/user');
                    setUser(res.data);
                } catch (err) {
                    console.error('Load user error:', err);
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };

        loadUser();
    }, [token]);

    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            setToken(res.data.token);
            setUser(res.data.user);
            toast.success('Login Successful');
            return true;
        } catch (err) {
            console.error('Login error:', err);
            toast.error(err.response?.data?.message || 'Login Failed');
            return false;
        }
    };

    const register = async (userData) => {
        try {
            const res = await api.post('/auth/register', userData);
            localStorage.setItem('token', res.data.token);
            setToken(res.data.token);
            setUser(res.data.user);
            toast.success('Registration Successful');
            return true;
        } catch (err) {
            console.error('Register error:', err);
            toast.error(err.response?.data?.message || 'Registration Failed');
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        toast.info('Logged out');
    };

    return (
        <AuthContext.Provider value={{
            user, loading, login, register, logout, isAuthenticated: !!user, loadUser: async () => {
                if (token) {
                    try {
                        const res = await api.get('/auth/user');
                        setUser(res.data);
                    } catch (err) {
                        console.error('Load user error:', err);
                        localStorage.removeItem('token');
                        setToken(null);
                        setUser(null);
                    }
                }
                setLoading(false);
            }
        }}>
            {children}
        </AuthContext.Provider>
    );
};
