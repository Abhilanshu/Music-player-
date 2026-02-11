import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';

const CreateInvoice = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [formData, setFormData] = useState({
        client: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        items: [{ description: '', quantity: 1, price: 0 }],
        taxRate: 0,
        notes: ''
    });

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await api.get('/clients');
                setClients(res.data);
            } catch (err) {
                console.error(err);
                toast.error('Failed to fetch clients');
            }
        };
        fetchClients();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleItemChange = (index, e) => {
        const newItems = [...formData.items];
        newItems[index][e.target.name] = e.target.value;
        setFormData({ ...formData, items: newItems });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { description: '', quantity: 1, price: 0 }]
        });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const calculateSubtotal = () => {
        return formData.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    };

    const calculateTax = () => {
        return (calculateSubtotal() * formData.taxRate) / 100;
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/invoices', formData);
            toast.success('Invoice created successfully');
            navigate('/dashboard/invoices');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to create invoice');
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Create New Invoice</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Client</label>
                        <select
                            name="client"
                            required
                            value={formData.client}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        >
                            <option value="">Select Client</option>
                            {clients.map(client => (
                                <option key={client._id} value={client._id}>{client.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input
                                type="date"
                                name="date"
                                required
                                value={formData.date}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Due Date</label>
                            <input
                                type="date"
                                name="dueDate"
                                required
                                value={formData.dueDate}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Invoice Items</h3>
                    <div className="space-y-2">
                        {formData.items.map((item, index) => (
                            <div key={index} className="flex space-x-2 items-end">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        name="description"
                                        placeholder="Description"
                                        required
                                        value={item.description}
                                        onChange={(e) => handleItemChange(index, e)}
                                        className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                                    />
                                </div>
                                <div className="w-20">
                                    <input
                                        type="number"
                                        name="quantity"
                                        placeholder="Qty"
                                        required
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, e)}
                                        className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                                    />
                                </div>
                                <div className="w-32">
                                    <input
                                        type="number"
                                        name="price"
                                        placeholder="Price"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={item.price}
                                        onChange={(e) => handleItemChange(index, e)}
                                        className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                                    />
                                </div>
                                <div className="w-32 pt-2 text-right font-medium text-gray-700">
                                    ₹{(item.quantity * item.price).toFixed(2)}
                                </div>
                                <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-2">
                                    <FaTrash />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addItem} className="mt-2 flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                        <FaPlus className="mr-1" /> Add Item
                    </button>
                </div>

                <div className="border-t border-gray-200 pt-4 flex justify-end">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Tax Rate (%):</span>
                            <input
                                type="number"
                                name="taxRate"
                                value={formData.taxRate}
                                onChange={handleInputChange}
                                className="w-20 border border-gray-300 rounded-md shadow-sm p-1 text-right"
                            />
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax Amount:</span>
                            <span className="font-medium">₹{calculateTax().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                            <span>Total:</span>
                            <span>₹{calculateTotal().toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                        name="notes"
                        rows="3"
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    ></textarea>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="button" onClick={() => navigate('/dashboard/invoices')} className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 shadow-sm">Create Invoice</button>
                </div>
            </form>
        </div>
    );
};

export default CreateInvoice;
