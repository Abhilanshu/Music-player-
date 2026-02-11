import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { FaPlus, FaSearch, FaFilePdf, FaEnvelope } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/invoices');
            setInvoices(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch invoices');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async (id, invoiceNumber) => {
        try {
            const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
        } catch (err) {
            console.error(err);
            toast.error('Failed to download PDF');
        }
    };

    const handleSendEmail = async (id) => {
        try {
            await api.post(`/invoices/${id}/email`);
            toast.success('Invoice sent via email');
        } catch (err) {
            console.error(err);
            toast.error('Failed to send email');
        }
    };

    const handlePayment = async (invoice) => {
        try {
            // 1. Create Order
            const { data: order } = await api.post('/payment/order', {
                amount: invoice.total,
                currency: 'INR',
                receipt: `receipt_${invoice.invoiceNumber}`
            });

            // 2. Open Razorpay
            const options = {
                key: "YOUR_RAZORPAY_KEY_ID_HERE", // Enter the Key ID generated from the Dashboard
                amount: order.amount,
                currency: order.currency,
                name: "InvoicePro",
                description: `Payment for Invoice #${invoice.invoiceNumber}`,
                order_id: order.id,
                handler: async function (response) {
                    try {
                        // 3. Verify Payment
                        await api.post('/payment/verify', {
                            orderCreationId: order.id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpaySignature: response.razorpay_signature,
                            invoiceId: invoice._id
                        });
                        toast.success('Payment Successful');
                        fetchInvoices(); // Refresh list
                    } catch (err) {
                        console.error(err);
                        toast.error('Payment Verification Failed');
                    }
                },
                prefill: {
                    name: invoice.client?.name,
                    email: invoice.client?.email,
                    contact: invoice.client?.phone
                },
                theme: {
                    color: "#4f46e5"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.open();
        } catch (err) {
            console.error(err);
            toast.error('Payment Initiation Failed');
        }
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoiceNumber.includes(searchTerm)
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Overdue': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
                <Link
                    to="/dashboard/invoices/new"
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                    <FaPlus className="mr-2" /> Create Invoice
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by client or invoice #..."
                            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-4">No invoices found</td></tr>
                            ) : (
                                filteredInvoices.map(invoice => (
                                    <tr key={invoice._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {invoice.invoiceNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {invoice.client?.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(invoice.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                            ₹{invoice.total.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                            <button
                                                onClick={() => handleDownloadPdf(invoice._id, invoice.invoiceNumber)}
                                                className="text-gray-600 hover:text-gray-900"
                                                title="Download PDF"
                                            >
                                                <FaFilePdf size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleSendEmail(invoice._id)}
                                                className="text-gray-600 hover:text-gray-900"
                                                title="Send Email"
                                            >
                                                <FaEnvelope size={18} />
                                            </button>
                                            {invoice.status !== 'Paid' && (
                                                <button
                                                    onClick={() => handlePayment(invoice)}
                                                    className="text-green-600 hover:text-green-900 font-bold"
                                                    title="Pay Now"
                                                >
                                                    Pay
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Invoices;
