# Catalog Search Service

A Node.js REST API service for searching and retrieving catalog items using SQLite as the database.

## API Documentation

The complete API specification is available in `catalog-search-api.yaml` in OpenAPI 3.0.3 format. You can view this file using:
- [Swagger Editor](https://editor.swagger.io/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Redocly](https://redocly.github.io/redoc/)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
node app.js
```

The server will start on port 3000 by default. You can change this by setting the `PORT` environment variable.

## Testing the API with cURL

### Unix/Linux/Git Bash Commands

#### GET Endpoints

1. Get all items:
```bash
curl -X GET "http://localhost:3000/catalog/search" | json_pp
```

2. Search with filters:
```bash
curl -X GET "http://localhost:3000/catalog/search?query=laptop&category=Electronics&minPrice=500&maxPrice=2000&inStock=true" | json_pp
```

3. Get item by ID:
```bash
curl -X GET "http://localhost:3000/catalog/items/YOUR-ITEM-ID" | json_pp
```

#### POST Endpoints

1. Create new item:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gaming Laptop",
    "description": "High-end gaming laptop",
    "category": "Electronics",
    "price": 1499.99,
    "inStock": true
  }' \
  http://localhost:3000/catalog/items | json_pp
```

2. Update item:
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{
    "price": 1399.99,
    "inStock": false
  }' \
  http://localhost:3000/catalog/items/YOUR-ITEM-ID | json_pp
```

3. Delete item:
```bash
curl -X DELETE http://localhost:3000/catalog/items/YOUR-ITEM-ID
```

### Windows PowerShell Commands

#### GET Endpoints

1. Get all items:
```powershell
curl.exe -X GET "http://localhost:3000/catalog/search" | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

2. Search with filters:
```powershell
curl.exe -X GET "http://localhost:3000/catalog/search?query=laptop&category=Electronics&minPrice=500&maxPrice=2000&inStock=true" | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

3. Get item by ID:
```powershell
curl.exe -X GET "http://localhost:3000/catalog/items/YOUR-ITEM-ID" | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

#### POST Endpoints

1. Create new item:
```powershell
$body = @{
    name = "Gaming Laptop"
    description = "High-end gaming laptop"
    category = "Electronics"
    price = 1499.99
    inStock = $true
} | ConvertTo-Json

curl.exe -X POST `
  -H "Content-Type: application/json" `
  -d $body `
  http://localhost:3000/catalog/items | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

2. Update item:
```powershell
$body = @{
    price = 1399.99
    inStock = $false
} | ConvertTo-Json

curl.exe -X PUT `
  -H "Content-Type: application/json" `
  -d $body `
  http://localhost:3000/catalog/items/YOUR-ITEM-ID | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

3. Delete item:
```powershell
curl.exe -X DELETE http://localhost:3000/catalog/items/YOUR-ITEM-ID
```

### Example Responses

#### Successful GET Search Response
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Gaming Laptop",
      "description": "High-end gaming laptop",
      "category": "Electronics",
      "price": 1499.99,
      "inStock": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

#### Successful POST Response
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Gaming Laptop",
  "description": "High-end gaming laptop",
  "category": "Electronics",
  "price": 1499.99,
  "inStock": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Error Responses

1. Bad Request (400):
```json
{
  "code": 400,
  "message": "Missing required fields"
}
```

2. Not Found (404):
```json
{
  "code": 404,
  "message": "Item not found"
}
```

3. Internal Server Error (500):
```json
{
  "code": 500,
  "message": "Internal server error"
}
```

## Notes

1. For Unix/Linux systems, `json_pp` is used for pretty-printing JSON responses. If it's not available:
   - Install it via your package manager
   - Use `python -m json.tool` instead
   - Use `jq` if available

2. For Windows PowerShell:
   - Use `curl.exe` instead of `curl` to avoid the PowerShell alias
   - Use `ConvertFrom-Json | ConvertTo-Json -Depth 10` for pretty-printing
   - PowerShell variables (`$body`) are used for cleaner JSON handling

3. Replace `YOUR-ITEM-ID` in the examples with an actual UUID from the search results.

## Sample Data

The service is initialized with sample data including:
- Laptop (price: $999.99, in stock)
- Smartphone (price: $699.99, in stock)
- Headphones (price: $199.99, out of stock)

You can modify the sample data in the `addSampleData` function in `app.js`.

## Running Tests

To run the test suite:
```bash
npm test
```

The test suite includes:
- Search functionality tests
- Filter tests (query, category, price, stock)
- Pagination tests
- Individual item retrieval tests
- Error handling tests 