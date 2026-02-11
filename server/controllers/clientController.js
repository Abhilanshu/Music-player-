const Client = require('../models/Client');

// @desc    Get all clients of logged in user
// @route   GET /api/clients
// @access  Private
exports.getClients = async (req, res) => {
    try {
        const clients = await Client.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(clients);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Add new client
// @route   POST /api/clients
// @access  Private
exports.addClient = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;

        const newClient = new Client({
            name,
            email,
            phone,
            address,
            user: req.user.id
        });

        const client = await newClient.save();
        res.json(client);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
exports.updateClient = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;

        let client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ message: 'Client not found' });

        if (client.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        client = await Client.findByIdAndUpdate(
            req.params.id,
            { $set: { name, email, phone, address } },
            { new: true }
        );

        res.json(client);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private
exports.deleteClient = async (req, res) => {
    try {
        let client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ message: 'Client not found' });

        if (client.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await Client.findByIdAndDelete(req.params.id);
        res.json({ message: 'Client removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
