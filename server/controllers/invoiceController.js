const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const User = require('../models/User');
const { generateInvoicePdf } = require('../utils/pdfGenerator');
const sendEmail = require('../utils/sendEmail');
const fs = require('fs');

// @desc    Get dashboard stats (Revenue, Counts, Monthly Data)
// @route   GET /api/invoices/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
    try {
        const invoices = await Invoice.find({ user: req.user.id });

        const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
        const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
        const pendingInvoices = invoices.filter(inv => inv.status === 'Pending');
        const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');

        const totalPaid = paidInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
        const totalPending = pendingInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
        const totalOverdue = overdueInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);

        // Monthly revenue for the last 6 months
        const monthlyRevenue = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = months[d.getMonth()];
            const year = d.getFullYear();

            const start = new Date(year, d.getMonth(), 1);
            const end = new Date(year, d.getMonth() + 1, 0);

            const monthInvoices = invoices.filter(inv => {
                const invDate = new Date(inv.date);
                return invDate >= start && invDate <= end && inv.status === 'Paid';
            });

            const revenue = monthInvoices.reduce((acc, inv) => acc + inv.total, 0);
            monthlyRevenue.push({ name: monthName, revenue });
        }

        res.json({
            totalRevenue,
            totalPaid,
            totalPending,
            totalOverdue,
            count: {
                total: invoices.length,
                paid: paidInvoices.length,
                pending: pendingInvoices.length,
                overdue: overdueInvoices.length
            },
            monthlyRevenue
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({ user: req.user.id })
            .populate('client', 'name email')
            .sort({ createdAt: -1 });
        res.json(invoices);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('client');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        if (invoice.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json(invoice);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
exports.createInvoice = async (req, res) => {
    try {
        const { client, date, dueDate, items, taxRate, notes } = req.body;

        // Auto-generate invoice number (simple increment for now)
        const lastInvoice = await Invoice.findOne({ user: req.user.id }).sort({ createdAt: -1 });
        let nextNum = 1001;
        if (lastInvoice && lastInvoice.invoiceNumber) {
            const lastNum = parseInt(lastInvoice.invoiceNumber);
            if (!isNaN(lastNum)) nextNum = lastNum + 1;
        }

        // Calculate totals
        let subTotal = 0;
        items.forEach(item => {
            item.amount = item.quantity * item.price;
            subTotal += item.amount;
        });

        const taxAmount = (subTotal * (taxRate || 0)) / 100;
        const total = subTotal + taxAmount;

        const newInvoice = new Invoice({
            user: req.user.id,
            client,
            invoiceNumber: nextNum.toString(),
            date,
            dueDate,
            items,
            subTotal,
            taxRate,
            taxAmount,
            total,
            notes
        });

        const invoice = await newInvoice.save();
        res.json(invoice);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update invoice (e.g. status)
// @route   PUT /api/invoices/:id
// @access  Private
exports.updateInvoice = async (req, res) => {
    try {
        let invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        if (invoice.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Allow updating status or other fields
        // For simplicity, just updating body fields
        invoice = await Invoice.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        res.json(invoice);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
exports.deleteInvoice = async (req, res) => {
    try {
        let invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        if (invoice.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await Invoice.findByIdAndDelete(req.params.id);
        res.json({ message: 'Invoice removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Generate PDF and Download
// @route   GET /api/invoices/:id/pdf
// @access  Private
exports.downloadPdf = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('client');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        if (invoice.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const user = await User.findById(req.user.id);
        const pdfPath = await generateInvoicePdf(invoice, invoice.client, user);

        res.download(pdfPath, `invoice-${invoice.invoiceNumber}.pdf`, (err) => {
            if (err) console.log(err);
            // Optionally delete file after download
            // fs.unlinkSync(pdfPath);
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// @desc    Email Invoice
// @route   POST /api/invoices/:id/email
// @access  Private
exports.emailInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('client');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        if (invoice.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const user = await User.findById(req.user.id);
        const pdfPath = await generateInvoicePdf(invoice, invoice.client, user);

        const emailOptions = {
            email: invoice.client.email,
            subject: `Invoice #${invoice.invoiceNumber} from ${user.businessName || user.name}`,
            message: `Dear ${invoice.client.name},\n\nPlease find attached invoice #${invoice.invoiceNumber}.\n\nThank you,\n${user.businessName || user.name}`,
            attachments: [
                {
                    filename: `invoice-${invoice.invoiceNumber}.pdf`,
                    path: pdfPath
                }
            ]
        };

        await sendEmail(emailOptions);

        // Clean up
        // fs.unlinkSync(pdfPath);

        res.json({ message: 'Email sent successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
