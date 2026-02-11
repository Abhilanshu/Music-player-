const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const clientController = require('../controllers/clientController');

router.use(auth);

router.get('/', clientController.getClients);
router.post('/', clientController.addClient);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

module.exports = router;
