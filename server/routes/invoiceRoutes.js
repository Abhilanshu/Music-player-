const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const invoiceController = require('../controllers/invoiceController');

router.use(auth);

router.get('/dashboard/stats', invoiceController.getDashboardStats);
router.get('/', invoiceController.getInvoices);
router.post('/', invoiceController.createInvoice);
router.get('/:id', invoiceController.getInvoice);
router.put('/:id', invoiceController.updateInvoice);
router.delete('/:id', invoiceController.deleteInvoice);
router.get('/:id/pdf', invoiceController.downloadPdf);
router.post('/:id/email', invoiceController.emailInvoice);

module.exports = router;
