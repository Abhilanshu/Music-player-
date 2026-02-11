import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FaMoneyBillWave, FaFileInvoice, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';

const StatsCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-4">
        <div className={`p-3 rounded-full ${color} text-white`}>
            <Icon className="text-2xl" />
        </div>
        <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        </div>
    </div>
);

const DashboardHome = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/invoices/dashboard/stats');
                setStats(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div>Loading Stats...</div>;
    if (!stats) return <div>Error loading stats</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Revenue"
                    value={`₹${stats.totalRevenue.toFixed(2)}`}
                    icon={FaMoneyBillWave}
                    color="bg-green-500"
                />
                <StatsCard
                    title="Paid Invoices"
                    value={stats.count.paid}
                    icon={FaCheckCircle}
                    color="bg-blue-500"
                />
                <StatsCard
                    title="Pending Amount"
                    value={`₹${stats.totalPending.toFixed(2)}`}
                    icon={FaFileInvoice}
                    color="bg-yellow-500"
                />
                <StatsCard
                    title="Overdue Amount"
                    value={`₹${stats.totalOverdue.toFixed(2)}`}
                    icon={FaExclamationCircle}
                    color="bg-red-500"
                />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Monthly Revenue</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.monthlyRevenue}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
