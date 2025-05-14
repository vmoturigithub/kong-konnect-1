const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const db = new sqlite3.Database('catalog.db');

const seedData = [
  // Electronics Category
  {
    id: uuidv4(),
    name: "Gaming Laptop Pro X",
    description: "15.6-inch gaming laptop with RTX 4080, 32GB RAM",
    category: "Electronics",
    price: 2499.99,
    inStock: true
  },
  {
    id: uuidv4(),
    name: "Smartphone Ultra",
    description: "Latest flagship smartphone with 6.7-inch display",
    category: "Electronics",
    price: 999.99,
    inStock: true
  },
  {
    id: uuidv4(),
    name: "Wireless Earbuds",
    description: "True wireless earbuds with noise cancellation",
    category: "Electronics",
    price: 199.99,
    inStock: false
  },
  {
    id: uuidv4(),
    name: "4K Smart TV",
    description: "65-inch 4K OLED Smart TV",
    category: "Electronics",
    price: 1499.99,
    inStock: true
  },

  // Books Category
  {
    id: uuidv4(),
    name: "JavaScript: The Complete Guide",
    description: "Comprehensive guide to modern JavaScript",
    category: "Books",
    price: 49.99,
    inStock: true
  },
  {
    id: uuidv4(),
    name: "Data Science Fundamentals",
    description: "Introduction to data science and analytics",
    category: "Books",
    price: 39.99,
    inStock: false
  },

  // Clothing Category
  {
    id: uuidv4(),
    name: "Winter Jacket",
    description: "Waterproof winter jacket with thermal lining",
    category: "Clothing",
    price: 129.99,
    inStock: true
  },
  {
    id: uuidv4(),
    name: "Running Shoes",
    description: "Professional running shoes with cushioning",
    category: "Clothing",
    price: 89.99,
    inStock: true
  },

  // Home & Kitchen
  {
    id: uuidv4(),
    name: "Coffee Maker",
    description: "Programmable coffee maker with thermal carafe",
    category: "Home & Kitchen",
    price: 79.99,
    inStock: true
  },
  {
    id: uuidv4(),
    name: "Air Fryer XL",
    description: "Large capacity digital air fryer",
    category: "Home & Kitchen",
    price: 149.99,
    inStock: false
  },

  // Sports & Outdoors
  {
    id: uuidv4(),
    name: "Mountain Bike",
    description: "27.5-inch mountain bike with front suspension",
    category: "Sports & Outdoors",
    price: 599.99,
    inStock: true
  },
  {
    id: uuidv4(),
    name: "Camping Tent",
    description: "4-person waterproof camping tent",
    category: "Sports & Outdoors",
    price: 199.99,
    inStock: true
  }
];

// Create table if it doesn't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS catalog_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    inStock INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`);

  // Clear existing data
  db.run('DELETE FROM catalog_items');

  // Insert seed data
  const stmt = db.prepare(`
    INSERT INTO catalog_items (id, name, description, category, price, inStock, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  seedData.forEach(item => {
    stmt.run(
      item.id,
      item.name,
      item.description,
      item.category,
      item.price,
      item.inStock ? 1 : 0
    );
  });

  stmt.finalize();

  console.log('Seed data has been inserted successfully!');
  
  // Query and display the inserted data
  db.all('SELECT * FROM catalog_items', (err, rows) => {
    if (err) {
      console.error('Error querying data:', err);
      return;
    }
    console.log('\nInserted Items:');
    console.table(rows);
    db.close();
  });
}); 