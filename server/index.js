const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
// const passport = require('passport'); // Temporarily disabled

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Initialize Passport (optional OAuth) - TEMPORARILY DISABLED
// try {
//     require('./config/passport');
//     app.use(passport.initialize());
//     console.log('Passport initialized');
// } catch (err) {
//     console.log('Passport initialization skipped:', err.message);
// }


// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));

app.get('/', (req, res) => {
    res.send('InvoicePro API is running');
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
