import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

import axios from 'axios';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isMobileLogin, setIsMobileLogin] = useState(false);
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const { login, loadUser } = useAuth();
    const navigate = useNavigate();

    const { email, password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        const success = await login(email, password);
        if (success) {
            navigate('/dashboard');
        }
    };

    const onMobileSubmit = async (e) => {
        e.preventDefault();
        if (!otpSent) {
            try {
                await axios.post('http://localhost:5000/api/auth/send-otp', { phone: mobile });
                setOtpSent(true);
                toast.success('OTP sent to console');
            } catch (err) {
                toast.error('Failed to send OTP');
            }
        } else {
            try {
                const res = await axios.post('http://localhost:5000/api/auth/verify-otp', { phone: mobile, otp });
                localStorage.setItem('token', res.data.token);
                await loadUser(); // You might need to expose loadUser from context or handle it there
                navigate('/dashboard');
            } catch (err) {
                toast.error('Invalid OTP');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to InvoicePro
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">start your 14-day free trial</Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={isMobileLogin ? onMobileSubmit : onSubmit}>
                    {!isMobileLogin ? (
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={onChange}
                                />
                            </div>
                            <div>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Password"
                                    value={password}
                                    onChange={onChange}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <input
                                    name="mobile"
                                    type="text"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Mobile Number"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    disabled={otpSent}
                                />
                            </div>
                            {otpSent && (
                                <div>
                                    <input
                                        name="otp"
                                        type="text"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Enter OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {isMobileLogin ? (otpSent ? 'Verify OTP' : 'Send OTP') : 'Sign in'}
                        </button>
                    </div>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <div>
                            <a
                                href="http://localhost:5000/api/auth/google"
                                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                            >
                                Google
                            </a>
                        </div>
                        <div>
                            <a
                                href="http://localhost:5000/api/auth/microsoft"
                                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                            >
                                Microsoft
                            </a>
                        </div>
                    </div>
                    <div className="mt-4 text-center">
                        <button
                            onClick={() => setIsMobileLogin(!isMobileLogin)}
                            className="text-indigo-600 hover:text-indigo-500 font-medium"
                        >
                            {isMobileLogin ? 'Login with Email' : 'Login with Mobile'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
