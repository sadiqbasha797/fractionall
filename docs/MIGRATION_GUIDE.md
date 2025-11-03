# Email Notification Preferences - Migration Guide

## 🎯 Purpose

This guide helps you migrate existing users to support the new email notification preferences feature.

## ⚠️ Why Migration is Needed

The email notification preferences feature adds a new `emailNotifications` field to the User model. Existing users in the database don't have this field, so we need to add it with default values (all notifications enabled).

## 📋 Pre-Migration Checklist

Before running the migration:

- [ ] **Backup your database** (highly recommended!)
- [ ] **Test on development/staging first**
- [ ] **Stop the backend server** (to avoid conflicts)
- [ ] **Verify MongoDB is running**
- [ ] **Check .env file has correct MONGO_URI**
- [ ] **Review the migration scripts**

## 🚀 Migration Steps

### Step 1: Backup Database

**MongoDB Backup:**
```bash
# Backup entire database
mongodump --uri="YOUR_MONGO_URI" --out=./backup-$(date +%Y%m%d)

# Or backup just users collection
mongodump --uri="YOUR_MONGO_URI" --collection=users --out=./backup-users
```

### Step 2: Verify Current State

Check how many users need migration:

```bash
cd backend
node migrations/verify-email-notifications.js
```

**Expected Output:**
```
✅ MongoDB connected successfully
🔍 Verifying email notification preferences status...

📊 Total users in database: 150
📊 Email Notification Preferences Status:
✅ Users with preferences: 0 (0.00%)
❌ Users without preferences: 150 (100.00%)
```

### Step 3: Run Migration

Add email preferences to all existing users:

```bash
node migrations/add-email-notifications-to-users.js
```

**Expected Output:**
```
✅ MongoDB connected successfully
🔄 Starting migration: Add email notification preferences to users...

📊 Found 150 users without email notification preferences
📦 Processing batch 1 (100 users)...
   ✓ Updated 10 users...
   ✓ Updated 20 users...
   ✓ Updated 30 users...
   ...
   ✓ Updated 100 users...

📦 Processing batch 2 (50 users)...
   ✓ Updated 110 users...
   ...
   ✓ Updated 150 users...

============================================================
📊 Migration Summary:
============================================================
✅ Successfully updated: 150 users
❌ Failed to update: 0 users
📈 Total processed: 150 users
============================================================

🔍 Verifying migration...
✅ Verification successful! All users now have email notification preferences.

📋 Sample of updated users:

1. John Doe (john@example.com)
   Email Notifications: {
     enabled: true,
     tokenPurchase: true,
     bookNowToken: true,
     amcPayment: true,
     booking: true,
     kyc: true,
     refund: true,
     sharedMember: true
   }

✅ Migration completed successfully!
```

### Step 4: Verify Migration Success

Confirm all users have been migrated:

```bash
node migrations/verify-email-notifications.js
```

**Expected Output:**
```
📊 Total users in database: 150
📊 Email Notification Preferences Status:
✅ Users with preferences: 150 (100.00%)
❌ Users without preferences: 0 (0.00%)

✅ STATUS: All users have email notification preferences!
✅ Migration is complete and successful.
```

### Step 5: Test the Feature

1. **Start the backend:**
   ```bash
   npm start
   ```

2. **Test API endpoints:**
   ```bash
   # Get preferences
   curl -X GET http://localhost:3000/api/users/email-notifications/preferences \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Test in mobile app:**
   - Login to the app
   - Open hamburger menu
   - Tap "Settings"
   - Verify preferences load correctly
   - Toggle some options
   - Save and verify changes persist

## 🔄 Rollback (If Needed)

If something goes wrong and you need to undo the migration:

```bash
node migrations/rollback-email-notifications.js
```

**You will be asked to confirm:**
```
⚠️  WARNING: This will remove email notification preferences from ALL users!
⚠️  This action cannot be undone easily.

Are you sure you want to proceed? (yes/no):
```

Type `yes` to proceed.

**Then restore from backup if needed:**
```bash
mongorestore --uri="YOUR_MONGO_URI" ./backup-20241215
```

## 📊 What Gets Added

Each user will get this new field:

```javascript
emailNotifications: {
  enabled: true,           // Master toggle
  tokenPurchase: true,     // Token purchase confirmations
  bookNowToken: true,      // Book now token confirmations
  amcPayment: true,        // AMC payment confirmations
  booking: true,           // Booking confirmations
  kyc: true,              // KYC updates and reminders
  refund: true,           // Refund notifications
  sharedMember: true      // Shared member updates
}
```

All values default to `true` to maintain current behavior (all emails enabled).

## 🐛 Troubleshooting

### Issue: "MongoDB connection error"
**Solution:**
```bash
# Check if MongoDB is running
mongosh

# Verify MONGO_URI in .env
cat .env | grep MONGO_URI

# Test connection
node -e "require('mongoose').connect(process.env.MONGO_URI).then(() => console.log('Connected')).catch(e => console.error(e))"
```

### Issue: "Some users failed to update"
**Solution:**
- Check the error messages in the migration output
- Run the migration again (it only updates users without preferences)
- Manually inspect problematic user documents

### Issue: "Migration is slow"
**Solution:**
- This is normal for large databases
- The script processes in batches of 100
- Don't interrupt the process
- Consider running during off-peak hours

### Issue: "Verification shows users without preferences after migration"
**Solution:**
- Run the migration script again
- Check MongoDB logs for errors
- Verify database permissions

## 📈 Performance

### Expected Duration
- **Small database** (<1,000 users): ~10-30 seconds
- **Medium database** (1,000-10,000 users): ~1-5 minutes
- **Large database** (>10,000 users): ~5-30 minutes

### Resource Usage
- **Memory**: Minimal (batch processing)
- **CPU**: Low to moderate
- **Network**: Depends on database location
- **Disk I/O**: Moderate

## ✅ Post-Migration Checklist

After successful migration:

- [ ] **Verify all users have preferences** (run verify script)
- [ ] **Test API endpoints** (GET and PUT)
- [ ] **Test mobile app Settings page**
- [ ] **Check application logs** for errors
- [ ] **Monitor email sending** for issues
- [ ] **Inform users** about new feature
- [ ] **Update documentation** if needed
- [ ] **Delete backup** after confirming everything works

## 📝 Migration Log Template

Keep a record of your migration:

```
Migration Date: _______________
Database: _______________
Total Users Before: _______________
Users Migrated: _______________
Errors: _______________
Duration: _______________
Performed By: _______________
Verified By: _______________
Notes: _______________
```

## 🔐 Security Considerations

- Migration scripts require database access
- Use secure connection strings
- Don't commit .env files with credentials
- Run migrations from secure environments
- Backup before making changes
- Verify changes before deploying to production

## 📞 Support

If you encounter issues:

1. **Check this guide** for troubleshooting steps
2. **Review migration script output** for error messages
3. **Check MongoDB logs** for database errors
4. **Verify .env configuration** is correct
5. **Test on development database** first
6. **Contact development team** if issues persist

## 📚 Related Documentation

- **Migration Scripts:** `backend/migrations/README.md`
- **Feature Documentation:** `docs/EMAIL_NOTIFICATION_PREFERENCES.md`
- **API Reference:** `docs/EMAIL_PREFERENCES_API_QUICK_REFERENCE.md`
- **Mobile Frontend:** `frontend-mobile/EMAIL_PREFERENCES_MOBILE_README.md`

## 🎉 Success Criteria

Migration is successful when:

✅ All users have `emailNotifications` field
✅ All preferences are set to `true` by default
✅ Verification script shows 100% coverage
✅ API endpoints work correctly
✅ Mobile app Settings page loads preferences
✅ Users can save preference changes
✅ Email service respects user preferences
✅ No errors in application logs

---

**Version:** 1.0.0
**Last Updated:** December 2024
**Maintainer:** Fraction Development Team
