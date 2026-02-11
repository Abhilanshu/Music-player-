import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaFileInvoiceDollar, FaUsers, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/dashboard', icon: FaHome, label: 'Dashboard' },
        { path: '/dashboard/invoices', icon: FaFileInvoiceDollar, label: 'Invoices' },
        { path: '/dashboard/clients', icon: FaUsers, label: 'Clients' },
        { path: '/dashboard/profile', icon: FaCog, label: 'Profile' },
        // { path: '/dashboard/settings', icon: FaCog, label: 'Settings' },
    ];

    return (
        <div className="bg-gray-800 text-white w-64 min-h-screen flex flex-col">
            <div className="h-16 flex items-center justify-center border-b border-gray-700">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                    InvoicePro
                </h1>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center px-4 py-3 rounded-md transition-colors duration-200 ${isActive(item.path)
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                    >
                        <item.icon className="mr-3 text-lg" />
                        <span className="font-medium">{item.label}</span>
                    </Link>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-700">
                <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-red-600 hover:text-white rounded-md transition-colors duration-200"
                >
                    <FaSignOutAlt className="mr-3" />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
