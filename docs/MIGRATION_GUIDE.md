# Most Browsed Cars - Migration Guide

## Overview

This guide explains how to migrate your existing database to support the Most Browsed Cars feature. The migration adds a `viewCount` field to all existing cars in your database.

## Quick Start

### 1. Basic Migration (Production)
```bash
cd backend
npm run migrate:add-viewcount
```

### 2. Add Sample Data (Testing/Demo)
```bash
cd backend
npm run migrate:add-sample-views
```

### 3. Using the Migration Runner
```bash
cd backend
npm run migrate help
npm run migrate add-viewcount
npm run migrate add-sample-views
```

## Migration Scripts

### 📋 Available Scripts

| Script | Purpose | Safety | When to Use |
|--------|---------|--------|-------------|
| `migrate-add-viewcount.js` | Adds viewCount field to all cars | ✅ Safe | Production deployment |
| `migrate-add-sample-views.js` | Adds random view counts for testing | ✅ Safe | Testing/demo |
| `migrate-remove-viewcount.js` | Removes viewCount field (rollback) | ⚠️ Destructive | Rollback only |

### 🚀 Running Migrations

#### Option 1: Using npm scripts (Recommended)
```bash
# Add viewCount field to all cars
npm run migrate:add-viewcount

# Add sample view counts for testing
npm run migrate:add-sample-views

# Remove viewCount field (rollback)
npm run migrate:remove-viewcount
```

#### Option 2: Direct execution
```bash
# Add viewCount field
node scripts/migrate-add-viewcount.js

# Add sample view counts
node scripts/migrate-add-sample-views.js

# Remove viewCount field
node scripts/migrate-remove-viewcount.js
```

#### Option 3: Using migration runner
```bash
# Show help
npm run migrate help

# List available migrations
npm run migrate list

# Run specific migration
npm run migrate add-viewcount
npm run migrate add-sample-views
npm run migrate remove-viewcount
```

## Migration Workflows

### 🏭 Production Deployment

1. **Deploy the code** with the new viewCount field
2. **Run the basic migration**:
   ```bash
   npm run migrate:add-viewcount
   ```
3. **Verify the migration**:
   - Check that all cars have viewCount field
   - Verify the most browsed cars API works
4. **Start tracking** real user views

### 🧪 Testing/Demo Setup

1. **Run the basic migration**:
   ```bash
   npm run migrate:add-viewcount
   ```
2. **Add sample data**:
   ```bash
   npm run migrate:add-sample-views
   ```
3. **Test the feature** with realistic data

### 🔄 Rollback Process

1. **Run the rollback migration**:
   ```bash
   npm run migrate:remove-viewcount
   ```
2. **Revert the code** to previous version

## Environment Setup

### Required Environment Variables

Make sure these are set in your `.env` file:

```bash
MONGODB_URI=mongodb://localhost:27017/fraction
# or your production MongoDB connection string
```

### Database Requirements

- MongoDB database with existing cars collection
- Network access to the database
- Read/write permissions on the cars collection

## Migration Details

### What the Migration Does

#### `migrate-add-viewcount.js`:
- Finds all cars without `viewCount` field
- Adds `viewCount: 0` to all existing cars
- Provides detailed logging and statistics
- Safe to run multiple times

#### `migrate-add-sample-views.js`:
- Ensures all cars have `viewCount` field
- Adds random view counts (5-200) to cars with 0 views
- Provides statistics about view distribution
- Safe to run multiple times

#### `migrate-remove-viewcount.js`:
- Removes `viewCount` field from all cars
- **WARNING**: Permanently deletes all view count data
- Use only for rollback purposes

### Database Changes

The migration adds this field to your Car model:
```javascript
viewCount: {
  type: Number,
  default: 0,
  required: false
}
```

## Verification

### After Running Migration

1. **Check the logs** for success messages
2. **Verify in database**:
   ```javascript
   // In MongoDB shell or compass
   db.cars.findOne({}, {carname: 1, viewCount: 1})
   ```
3. **Test the API**:
   ```bash
   curl http://localhost:3000/api/cars/public/most-browsed
   ```

### Expected Results

- All cars should have `viewCount` field
- Most browsed cars API should return cars sorted by view count
- Frontend should display most browsed cars section

## Troubleshooting

### Common Issues

#### ❌ Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Check your `MONGODB_URI` and ensure MongoDB is running

#### ❌ No Cars Found
```
No cars found in database. Migration not needed.
```
**Solution**: This is normal if your database is empty

#### ❌ Permission Denied
```
Error: not authorized on fraction to execute command
```
**Solution**: Check your database user permissions

#### ❌ Migration Partially Failed
```
Some cars still don't have viewCount field
```
**Solution**: Run the migration again - it's safe to run multiple times

### Debug Steps

1. **Check environment variables**:
   ```bash
   echo $MONGODB_URI
   ```

2. **Test database connection**:
   ```bash
   node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(console.error)"
   ```

3. **Check migration logs** for specific error messages

4. **Verify database state**:
   ```javascript
   // Count cars with/without viewCount
   db.cars.countDocuments({viewCount: {$exists: true}})
   db.cars.countDocuments({viewCount: {$exists: false}})
   ```

## Safety Notes

- ✅ **Safe migrations**: `add-viewcount`, `add-sample-views`
- ⚠️ **Destructive migration**: `remove-viewcount` (permanently deletes data)
- 🔒 **Always backup** your database before running migrations in production
- 🧪 **Test migrations** in a development environment first
- 🔄 **Idempotent**: Safe to run migrations multiple times

## Support

If you encounter issues:

1. **Check the migration logs** for specific error messages
2. **Verify your database connection** and permissions
3. **Ensure you're running** the migration from the correct directory
4. **Check that all required** environment variables are set
5. **Test in development** environment first

## Next Steps

After successful migration:

1. **Deploy the frontend** with the most browsed cars feature
2. **Monitor the API** for view tracking
3. **Check the most browsed cars** section in the frontend
4. **Verify view counts** are being tracked correctly
