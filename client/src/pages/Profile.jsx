import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user, loadUser } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        businessName: '',
        phone: '',
        address: '',
        gstin: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                businessName: user.businessName || '',
                phone: user.phone || '',
                address: user.address || '',
                gstin: user.gstin || ''
            });
        }
    }, [user]);

    const { name, email, businessName, phone, address, gstin } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const res = await axios.put('http://localhost:5000/api/auth/profile', formData, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            toast.success('Profile updated successfully');
            loadUser(); // Refresh user data
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Error updating profile');
        }
    };

    return (
        <div className="p-6 text-gray-800">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Business Profile</h1>
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl">
                <form onSubmit={onSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-700 font-bold mb-2">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={name}
                                onChange={onChange}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-bold mb-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                className="w-full p-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
                                disabled
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 font-bold mb-2">Business Name</label>
                        <input
                            type="text"
                            name="businessName"
                            value={businessName}
                            onChange={onChange}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            placeholder="e.g. My Creative Agency"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-700 font-bold mb-2">Phone</label>
                            <input
                                type="text"
                                name="phone"
                                value={phone}
                                onChange={onChange}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-bold mb-2">GSTIN / Tax ID</label>
                            <input
                                type="text"
                                name="gstin"
                                value={gstin}
                                onChange={onChange}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 font-bold mb-2">Address</label>
                        <textarea
                            name="address"
                            value={address}
                            onChange={onChange}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            rows="3"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                    >
                        Save Profile
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
