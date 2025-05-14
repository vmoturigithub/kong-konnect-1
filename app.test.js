const request = require('supertest');
const express = require('express');
const { dbInit } = require('./db');
const app = require('./app'); // We need to modify app.js to export the app

describe('Catalog Search API', () => {
    beforeAll(async () => {
        await dbInit; // Wait for database initialization
    });

    let createdItemId;

    describe('POST /catalog/items', () => {
        test('should create a new item with valid data', async () => {
            const newItem = {
                name: 'Test Product',
                description: 'A test product',
                category: 'Test',
                price: 99.99,
                inStock: true
            };

            const res = await request(app)
                .post('/catalog/items')
                .send(newItem);
            
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe(newItem.name);
            expect(res.body.description).toBe(newItem.description);
            expect(res.body.category).toBe(newItem.category);
            expect(res.body.price).toBe(newItem.price);
            expect(res.body.inStock).toBe(newItem.inStock);
            expect(res.body).toHaveProperty('createdAt');
            expect(res.body).toHaveProperty('updatedAt');

            // Save the ID for later tests
            createdItemId = res.body.id;
        });

        test('should return 400 when required fields are missing', async () => {
            const invalidItem = {
                name: 'Test Product',
                // missing category
                price: 99.99
                // missing inStock
            };

            const res = await request(app)
                .post('/catalog/items')
                .send(invalidItem);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('code', 400);
            expect(res.body).toHaveProperty('message', 'Missing required fields');
        });

        test('should return 400 when price is invalid', async () => {
            const invalidItem = {
                name: 'Test Product',
                description: 'A test product',
                category: 'Test',
                price: -10, // negative price
                inStock: true
            };

            const res = await request(app)
                .post('/catalog/items')
                .send(invalidItem);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('code', 400);
            expect(res.body).toHaveProperty('message', 'Invalid price value');
        });
    });

    describe('GET /catalog/search', () => {
        test('should return all items when no filters are applied', async () => {
            const res = await request(app)
                .get('/catalog/search');
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('items');
            expect(res.body).toHaveProperty('total');
            expect(res.body).toHaveProperty('page');
            expect(res.body).toHaveProperty('pageSize');
            expect(Array.isArray(res.body.items)).toBeTruthy();
        });

        test('should filter items by query string', async () => {
            const res = await request(app)
                .get('/catalog/search?query=laptop');
            
            expect(res.status).toBe(200);
            expect(res.body.items.every(item => 
                item.name.toLowerCase().includes('laptop') || 
                item.description.toLowerCase().includes('laptop')
            )).toBeTruthy();
        });

        test('should filter items by category', async () => {
            const res = await request(app)
                .get('/catalog/search?category=Electronics');
            
            expect(res.status).toBe(200);
            expect(res.body.items.every(item => 
                item.category === 'Electronics'
            )).toBeTruthy();
        });

        test('should filter items by price range', async () => {
            const res = await request(app)
                .get('/catalog/search?minPrice=200&maxPrice=800');
            
            expect(res.status).toBe(200);
            expect(res.body.items.every(item => 
                item.price >= 200 && item.price <= 800
            )).toBeTruthy();
        });

        test('should filter items by stock availability', async () => {
            // First verify we have items in stock
            const allItems = await request(app)
                .get('/catalog/search');
            
            // Make sure we have at least one item in stock
            expect(allItems.body.items.some(item => item.inStock === true)).toBeTruthy();

            const res = await request(app)
                .get('/catalog/search?inStock=true');
            
            expect(res.status).toBe(200);
            expect(res.body.items.length).toBeGreaterThan(0);
            expect(res.body.items.every(item => item.inStock === true)).toBeTruthy();
        });

        test('should handle pagination correctly', async () => {
            const res = await request(app)
                .get('/catalog/search?page=1&pageSize=2');
            
            expect(res.status).toBe(200);
            expect(res.body.items.length).toBeLessThanOrEqual(2);
            expect(res.body.page).toBe(1);
            expect(res.body.pageSize).toBe(2);
        });
    });

    describe('GET /catalog/items/:id', () => {
        test('should return item when valid ID is provided', async () => {
            const res = await request(app)
                .get(`/catalog/items/${createdItemId}`);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('id', createdItemId);
            expect(res.body).toHaveProperty('name');
            expect(res.body).toHaveProperty('category');
            expect(res.body).toHaveProperty('price');
            expect(res.body).toHaveProperty('inStock');
        });

        test('should return 404 when invalid ID is provided', async () => {
            const res = await request(app)
                .get('/catalog/items/invalid-id');
            
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('code', 404);
            expect(res.body).toHaveProperty('message', 'Item not found');
        });
    });

    describe('PUT /catalog/items/:id', () => {
        test('should update an existing item with valid data', async () => {
            const updates = {
                name: 'Updated Product',
                price: 149.99,
                inStock: false
            };

            const res = await request(app)
                .put(`/catalog/items/${createdItemId}`)
                .send(updates);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('id', createdItemId);
            expect(res.body.name).toBe(updates.name);
            expect(res.body.price).toBe(updates.price);
            expect(res.body.inStock).toBe(updates.inStock);
            // Original fields should remain unchanged
            expect(res.body).toHaveProperty('category');
            expect(res.body).toHaveProperty('description');
        });

        test('should return 404 when updating non-existent item', async () => {
            const updates = {
                name: 'Updated Product',
                price: 149.99
            };

            const res = await request(app)
                .put('/catalog/items/non-existent-id')
                .send(updates);
            
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('code', 404);
            expect(res.body).toHaveProperty('message', 'Item not found');
        });

        test('should return 400 when no fields to update', async () => {
            const res = await request(app)
                .put(`/catalog/items/${createdItemId}`)
                .send({});
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('code', 400);
            expect(res.body).toHaveProperty('message', 'No fields to update');
        });

        test('should return 400 when price is invalid', async () => {
            const updates = {
                price: -50 // negative price
            };

            const res = await request(app)
                .put(`/catalog/items/${createdItemId}`)
                .send(updates);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('code', 400);
            expect(res.body).toHaveProperty('message', 'Invalid price value');
        });
    });

    describe('DELETE /catalog/items/:id', () => {
        test('should delete an existing item', async () => {
            const res = await request(app)
                .delete(`/catalog/items/${createdItemId}`);
            
            expect(res.status).toBe(204);
            expect(res.body).toEqual({});

            // Verify item is deleted
            const getRes = await request(app)
                .get(`/catalog/items/${createdItemId}`);
            expect(getRes.status).toBe(404);
        });

        test('should return 404 when deleting non-existent item', async () => {
            const res = await request(app)
                .delete('/catalog/items/non-existent-id');
            
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('code', 404);
            expect(res.body).toHaveProperty('message', 'Item not found');
        });
    });
}); 