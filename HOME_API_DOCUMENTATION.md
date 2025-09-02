# Home API Documentation

This document outlines all the API endpoints for the Home module, which includes Hero Content, Brands, Simple Steps, and FAQs.

## Base URL
All endpoints are prefixed with `/api/home`

## Authentication
- **Public APIs**: No authentication required
- **Admin/SuperAdmin APIs**: Require Bearer token with admin or superadmin role

---

## Hero Content APIs

### Public APIs
- `GET /api/home/hero-content/public` - Get all hero content (public)

### Admin/SuperAdmin APIs
- `POST /api/home/hero-content` - Create new hero content
- `GET /api/home/hero-content` - Get all hero content (admin view)
- `GET /api/home/hero-content/:id` - Get hero content by ID
- `PUT /api/home/hero-content/:id` - Update hero content by ID
- `DELETE /api/home/hero-content/:id` - Delete hero content by ID

### Hero Content Model Fields
- `bgImage` (String, required) - Background image URL
- `heroText` (String, required) - Main hero text
- `subText` (String, required) - Subtitle text
- `createdBy` (ObjectId, required) - Reference to Admin who created it
- `createdAt` (Date, auto-generated) - Creation timestamp

---

## Brands APIs

### Public APIs
- `GET /api/home/brands/public` - Get all brands (public)

### Admin/SuperAdmin APIs
- `POST /api/home/brands` - Create new brand
- `GET /api/home/brands` - Get all brands (admin view)
- `GET /api/home/brands/:id` - Get brand by ID
- `PUT /api/home/brands/:id` - Update brand by ID
- `DELETE /api/home/brands/:id` - Delete brand by ID

### Brands Model Fields
- `brandName` (String, required) - Name of the brand
- `brandLogo` (String, required) - Brand logo URL
- `subText` (String, required) - Brand description/subtitle
- `createdBy` (ObjectId, required) - Reference to Admin who created it
- `createdAt` (Date, auto-generated) - Creation timestamp

---

## Simple Steps APIs

### Public APIs
- `GET /api/home/simple-steps/public` - Get all simple steps (public)

### Admin/SuperAdmin APIs
- `POST /api/home/simple-steps` - Create new simple step
- `GET /api/home/simple-steps` - Get all simple steps (admin view)
- `GET /api/home/simple-steps/:id` - Get simple step by ID
- `PUT /api/home/simple-steps/:id` - Update simple step by ID
- `DELETE /api/home/simple-steps/:id` - Delete simple step by ID

### Simple Steps Model Fields
- `stepTitle` (String) - Title of the step
- `stepName` (String) - Name/description of the step
- `createdBy` (ObjectId) - Reference to Admin who created it
- `createdAt` (Date, auto-generated) - Creation timestamp

---

## FAQ APIs

### Public APIs
- `GET /api/home/faqs/public` - Get all FAQs (public)

### Admin/SuperAdmin APIs
- `POST /api/home/faqs` - Create new FAQ
- `GET /api/home/faqs` - Get all FAQs (admin view)
- `GET /api/home/faqs/:id` - Get FAQ by ID
- `PUT /api/home/faqs/:id` - Update FAQ by ID
- `DELETE /api/home/faqs/:id` - Delete FAQ by ID

### FAQ Model Fields
- `question` (String, required) - FAQ question
- `category` (String, required) - Category enum: ['Understanding', 'Pricing', 'Car Delivery', 'Car Usage Policy']
- `answer` (String, required) - FAQ answer
- `createdAt` (Date, auto-generated) - Creation timestamp

---

## Request/Response Format

### Success Response
```json
{
  "status": "success",
  "body": {
    // Data object(s)
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "status": "failed",
  "body": {},
  "message": "Error description"
}
```

---

## Example Usage

### Create Hero Content (Admin/SuperAdmin)
```bash
POST /api/home/hero-content
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Form Data:
- bgImage: (file) - Background image file (optional, can also provide URL in bgImage field)
- heroText: "Welcome to Our Platform"
- subText: "The best car sharing experience"
```

**Note:** You can either upload an image file using the `bgImage` field or provide a URL in the `bgImage` field. If both are provided, the uploaded file takes precedence.

### Get All Brands (Public)
```bash
GET /api/home/brands/public
```

### Update Simple Step (Admin/SuperAdmin)
```bash
PUT /api/home/simple-steps/64a1b2c3d4e5f6789abcdef0
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "stepTitle": "Step 1",
  "stepName": "Choose Your Car"
}
```

### Create Simple Step (Admin/SuperAdmin)
```bash
POST /api/home/simple-steps
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "stepTitle": "Step 1",
  "stepName": "Choose Your Car"
}
```

### Create Brand (Admin/SuperAdmin)
```bash
POST /api/home/brands
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Form Data:
- brandLogo: (file) - Brand logo file (optional, can also provide URL in brandLogo field)
- brandName: "BMW"
- subText: "Luxury German Automobiles"
```

---

## Notes
- All timestamps are automatically generated
- The `createdBy` field is automatically populated from the authenticated user's ID
- Public APIs return the same data structure but without sensitive information
- All endpoints include proper error handling and logging
- The FAQ functionality has been moved from the separate FAQ controller to this unified home controller
- **Image Upload Support**: Image fields (bgImage, brandLogo) support both file uploads via Cloudinary and direct URL input
- **File Upload**: Use `multipart/form-data` content type for endpoints that accept file uploads
- **Cloudinary Integration**: Uploaded images are automatically processed and stored in Cloudinary, with temporary files cleaned up after upload
- **File Size Limit**: Maximum file size is 5MB per image
- **Supported Formats**: Only image files are accepted (jpg, png, gif, etc.)
