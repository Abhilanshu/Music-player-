const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

exports.generateInvoicePdf = async (invoice, client, user) => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Basic HTML template for the invoice
        // In a real app, this would be a separate EJS/Pug file or more complex HTML construction
        const content = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Helvetica', sans-serif; padding: 20px; }
                .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .title { font-size: 24px; font-weight: bold; color: #333; }
                .details { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .totals { margin-top: 20px; text-align: right; }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <div class="title">INVOICE</div>
                    <div>#${invoice.invoiceNumber}</div>
                    <div>Date: ${new Date(invoice.date).toLocaleDateString()}</div>
                    <div>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</div>
                </div>
                <div style="text-align: right;">
                    <strong>${user.businessName || user.name}</strong><br>
                    ${user.email}<br>
                    ${user.address || ''}<br>
                    ${user.phone || ''}
                </div>
            </div>

            <div class="details">
                <strong>Bill To:</strong><br>
                ${client.name}<br>
                ${client.email}<br>
                ${client.address || ''}<br>
                ${client.phone || ''}
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items.map(item => `
                        <tr>
                            <td>${item.description}</td>
                            <td>${item.quantity}</td>
                            <td>${item.price.toFixed(2)}</td>
                            <td>${item.amount.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="totals">
                <p>Subtotal: ${invoice.subTotal.toFixed(2)}</p>
                <p>Tax: ${invoice.taxAmount.toFixed(2)} (${invoice.taxRate}%)</p>
                <h3>Total: ${invoice.total.toFixed(2)}</h3>
            </div>
            
            ${invoice.notes ? `<div style="margin-top: 30px;"><strong>Notes:</strong><br>${invoice.notes}</div>` : ''}
        </body>
        </html>
        `;

        await page.setContent(content);

        // Create invoices directory if it doesn't exist
        const invoiceDir = path.join(__dirname, '..', 'invoices');
        if (!fs.existsSync(invoiceDir)) {
            fs.mkdirSync(invoiceDir);
        }

        const pdfPath = path.join(invoiceDir, `invoice-${invoice.invoiceNumber}.pdf`);
        await page.pdf({ path: pdfPath, format: 'A4' });

        await browser.close();
        return pdfPath;
    } catch (err) {
        console.error('PDF Generation Error:', err);
        throw err;
    }
};
