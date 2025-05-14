const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { db, dbInit } = require('./db');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
const httpPort = 3000;
const httpsPort = 3443;

// SSL/TLS Configuration
const sslOptions = {
  //key: fs.readFileSync(path.join(__dirname, 'MYCERTS2', 'nodejs.local.key')),
  //cert: fs.readFileSync(path.join(__dirname, 'MYCERTS2', 'nodejs.local-bundle.crt'))
    key: fs.readFileSync(path.join(__dirname, 'MYCERTS3', 'nodejs-svc.com.key')),
    cert: fs.readFileSync(path.join(__dirname, 'MYCERTS3', 'nodejs-svc.com-bundle.crt'))
};

app.use(cors());
app.use(express.json());

// Helper function to convert SQLite boolean (0/1) to JS boolean
function convertBooleans(item) {
    if (item) {
        item.inStock = item.inStock === 1;
    }
    return item;
}

// Search catalog items
app.get('/catalog/search', (req, res) => {
    const {
        query,
        category,
        minPrice,
        maxPrice,
        inStock,
        page = 1,
        pageSize = 20
    } = req.query;

    const params = [];
    let whereClause = '1=1';

    if (query) {
        whereClause += ' AND (name LIKE ? OR description LIKE ?)';
        params.push(`%${query}%`, `%${query}%`);
    }

    if (category) {
        whereClause += ' AND category = ?';
        params.push(category);
    }

    if (minPrice !== undefined) {
        whereClause += ' AND price >= ?';
        params.push(parseFloat(minPrice));
    }

    if (maxPrice !== undefined) {
        whereClause += ' AND price <= ?';
        params.push(parseFloat(maxPrice));
    }

    if (inStock !== undefined) {
        whereClause += ' AND inStock = ?';
        params.push(inStock === 'true' ? 1 : 0);
    }

    const offset = (page - 1) * pageSize;
    
    // Get total count
    db.get(`SELECT COUNT(*) as total FROM catalog_items WHERE ${whereClause}`, params, (err, row) => {
        if (err) {
            console.error('Error counting items:', err);
            return res.status(500).json({
                code: 500,
                message: 'Internal server error'
            });
        }

        const total = row.total;

        // Get paginated results
        db.all(
            `SELECT * FROM catalog_items WHERE ${whereClause} LIMIT ? OFFSET ?`,
            [...params, pageSize, offset],
            (err, items) => {
                if (err) {
                    console.error('Error fetching items:', err);
                    return res.status(500).json({
                        code: 500,
                        message: 'Internal server error'
                    });
                }

                res.json({
                    items: items.map(convertBooleans),
                    total,
                    page: parseInt(page),
                    pageSize: parseInt(pageSize)
                });
            }
        );
    });
});

// Create a new catalog item
app.post('/catalog/items', (req, res) => {
    const { name, description, category, price, inStock } = req.body;

    // Validate required fields
    if (!name || !category || price === undefined || inStock === undefined) {
        return res.status(400).json({
            code: 400,
            message: 'Missing required fields'
        });
    }

    // Validate price
    if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({
            code: 400,
            message: 'Invalid price value'
        });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.run(
        'INSERT INTO catalog_items (id, name, description, category, price, inStock, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, name, description, category, price, inStock ? 1 : 0, now, now],
        (err) => {
            if (err) {
                console.error('Error creating item:', err);
                return res.status(500).json({
                    code: 500,
                    message: 'Internal server error'
                });
            }

            // Fetch the created item
            db.get('SELECT * FROM catalog_items WHERE id = ?', [id], (err, item) => {
                if (err) {
                    console.error('Error fetching created item:', err);
                    return res.status(500).json({
                        code: 500,
                        message: 'Internal server error'
                    });
                }

                res.status(201).json({
                    ...item,
                    inStock: item.inStock === 1
                });
            });
        }
    );
});

// Get catalog item by ID
app.get('/catalog/items/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM catalog_items WHERE id = ?', [id], (err, item) => {
        if (err) {
            console.error('Error fetching item:', err);
            return res.status(500).json({
                code: 500,
                message: 'Internal server error'
            });
        }

        if (!item) {
            return res.status(404).json({
                code: 404,
                message: 'Item not found'
            });
        }

        res.json(convertBooleans(item));
    });
});

// Update a catalog item
app.put('/catalog/items/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, category, price, inStock } = req.body;

    // Validate that at least one field is being updated
    if (!name && !description && !category && price === undefined && inStock === undefined) {
        return res.status(400).json({
            code: 400,
            message: 'No fields to update'
        });
    }

    // Validate price if provided
    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
        return res.status(400).json({
            code: 400,
            message: 'Invalid price value'
        });
    }

    // Build update query
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
    }
    if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
    }
    if (category !== undefined) {
        updates.push('category = ?');
        values.push(category);
    }
    if (price !== undefined) {
        updates.push('price = ?');
        values.push(price);
    }
    if (inStock !== undefined) {
        updates.push('inStock = ?');
        values.push(inStock ? 1 : 0);
    }

    updates.push('updatedAt = ?');
    values.push(new Date().toISOString());

    // Add id to values array
    values.push(id);

    const updateQuery = `
        UPDATE catalog_items 
        SET ${updates.join(', ')}
        WHERE id = ?
    `;

    db.run(updateQuery, values, function(err) {
        if (err) {
            console.error('Error updating item:', err);
            return res.status(500).json({
                code: 500,
                message: 'Internal server error'
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                code: 404,
                message: 'Item not found'
            });
        }

        // Fetch the updated item
        db.get('SELECT * FROM catalog_items WHERE id = ?', [id], (err, item) => {
            if (err) {
                console.error('Error fetching updated item:', err);
                return res.status(500).json({
                    code: 500,
                    message: 'Internal server error'
                });
            }

            res.json({
                ...item,
                inStock: item.inStock === 1
            });
        });
    });
});

// Delete a catalog item
app.delete('/catalog/items/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM catalog_items WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Error deleting item:', err);
            return res.status(500).json({
                code: 500,
                message: 'Internal server error'
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                code: 404,
                message: 'Item not found'
            });
        }

        res.status(204).send();
    });
});

// Add sample data (for testing purposes)
async function addSampleData() {
    await dbInit; // Wait for database initialization

    const sampleItems = [
        {
            id: uuidv4(),
            name: 'Laptop',
            description: 'High-performance laptop',
            category: 'Electronics',
            price: 999.99,
            inStock: true
        },
        {
            id: uuidv4(),
            name: 'Smartphone',
            description: 'Latest model smartphone',
            category: 'Electronics',
            price: 699.99,
            inStock: true
        },
        {
            id: uuidv4(),
            name: 'Headphones',
            description: 'Wireless noise-canceling headphones',
            category: 'Electronics',
            price: 199.99,
            inStock: false
        }
    ];

    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT OR IGNORE INTO catalog_items (id, name, description, category, price, inStock) VALUES (?, ?, ?, ?, ?, ?)');
        
        try {
            sampleItems.forEach(item => {
                stmt.run([item.id, item.name, item.description, item.category, item.price, item.inStock ? 1 : 0]);
            });
            stmt.finalize();
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

// Initialize database and start servers
if (require.main === module) {
    addSampleData().then(() => {
        // Create HTTP server
        http.createServer(app).listen(httpPort, () => {
            console.log(`HTTP Server is running on http://localhost:${httpPort}`);
        });

        // Create HTTPS server
        https.createServer(sslOptions, app).listen(httpsPort, () => {
            console.log(`HTTPS Server is running on https://localhost:${httpsPort}`);
        });
    }).catch(err => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });
} else {
    // For testing purposes, add sample data immediately
    addSampleData();
}

module.exports = app; 