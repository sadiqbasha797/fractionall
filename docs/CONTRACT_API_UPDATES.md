# Contract API Updates

## Overview
The contract API has been enhanced to support file uploads directly in the create contract endpoint and includes new APIs for managing contract documents.

## Changes Made

### 1. Enhanced Create Contract API
**Endpoint:** `POST /api/contracts/`
**Changes:**
- Now supports file uploads directly during contract creation
- Accepts `contract_docs` files via multipart/form-data
- Files are automatically uploaded to Cloudinary
- Combines uploaded files with any existing `contract_docs` from the request body

**Request Format:**
```
Content-Type: multipart/form-data

Fields:
- carid: ObjectId (required)
- userid: ObjectId (required) 
- ticketid: ObjectId (required)
- contract_docs: File[] (optional - PDF files)
- contract_docs: String[] (optional - existing URLs)
```

**Response:**
```json
{
  "status": "success",
  "body": {
    "contract": { /* populated contract object */ },
    "uploadedDocuments": ["url1", "url2", ...]
  },
  "message": "Contract created successfully with 2 document(s)"
}
```

### 2. Delete Contract Documents API
**Endpoint:** `DELETE /api/contracts/docs/:contractId`
**Purpose:** Remove specific documents from a contract

**Request Body:**
```json
{
  "docIndexes": [0, 2, 4]  // Array of document indexes to delete
}
```

**Response:**
```json
{
  "status": "success",
  "body": {
    "contract": { /* updated contract object */ },
    "deletedDocuments": ["url1", "url2", ...],
    "deletedCount": 3
  },
  "message": "3 contract document(s) deleted successfully"
}
```

**Features:**
- Validates document indexes
- Deletes files from Cloudinary
- Updates database with remaining documents
- Maintains proper authorization checks

### 3. Update Contract Documents API
**Endpoint:** `PUT /api/contracts/docs/:contractId`
**Purpose:** Replace existing documents with new ones

**Request Format:**
```
Content-Type: multipart/form-data

Fields:
- docIndexes: String (JSON array of document indexes to replace)
- contract_docs: File[] (new files to replace with)
```

**Example Request Body:**
```
docIndexes: "[0, 2]"
contract_docs: [file1.pdf, file2.pdf]
```

**Response:**
```json
{
  "status": "success",
  "body": {
    "contract": { /* updated contract object */ },
    "replacedDocuments": {
      "old": ["old_url1", "old_url2"],
      "new": ["new_url1", "new_url2"]
    },
    "replacedCount": 2
  },
  "message": "2 contract document(s) updated successfully"
}
```

**Features:**
- Validates that number of files matches number of indexes
- Uploads new files to Cloudinary
- Deletes old files from Cloudinary
- Replaces documents at specified indexes
- Maintains proper authorization checks

## Authorization
All new endpoints require Admin or SuperAdmin authentication:
- `authMiddleware(['admin', 'superadmin'])`

## File Handling
- Only PDF files are accepted
- Maximum file size: 10MB per file
- Files are stored in Cloudinary under `contract-documents/` folder
- Automatic cleanup of old files when updating/deleting

## Error Handling
- Comprehensive validation for all inputs
- Proper error messages for different failure scenarios
- Graceful handling of Cloudinary upload/deletion failures
- Database rollback protection

## Usage Examples

### Create Contract with Files
```bash
curl -X POST http://localhost:3000/api/contracts/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "carid=60f7b3b3b3b3b3b3b3b3b3b3" \
  -F "userid=60f7b3b3b3b3b3b3b3b3b3b4" \
  -F "ticketid=60f7b3b3b3b3b3b3b3b3b3b5" \
  -F "contract_docs=@document1.pdf" \
  -F "contract_docs=@document2.pdf"
```

### Delete Specific Documents
```bash
curl -X DELETE http://localhost:3000/api/contracts/docs/60f7b3b3b3b3b3b3b3b3b3b6 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"docIndexes": [0, 2]}'
```

### Update Documents
```bash
curl -X PUT http://localhost:3000/api/contracts/docs/60f7b3b3b3b3b3b3b3b3b3b6 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "docIndexes=[0, 1]" \
  -F "contract_docs=@new_document1.pdf" \
  -F "contract_docs=@new_document2.pdf"
```
