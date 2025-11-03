# Migration Quick Reference Card

## 🚀 Quick Commands

### Before Migration
```bash
# Backup database
mongodump --uri="YOUR_MONGO_URI" --out=./backup-$(date +%Y%m%d)

# Check current state
cd backend
node migrations/verify-email-notifications.js
```

### Run Migration
```bash
# Add email preferences to all users
node migrations/add-email-notifications-to-users.js
```

### After Migration
```bash
# Verify success
node migrations/verify-email-notifications.js

# Test backend
node test-email-preferences.js
```

### If Something Goes Wrong
```bash
# Rollback (removes preferences)
node migrations/rollback-email-notifications.js

# Restore from backup
mongorestore --uri="YOUR_MONGO_URI" ./backup-20241215
```

## 📊 Expected Output

### Verification (Before)
```
📊 Total users: 150
✅ With preferences: 0 (0%)
❌ Without preferences: 150 (100%)
```

### Migration
```
📊 Found 150 users without preferences
✅ Successfully updated: 150 users
❌ Failed: 0 users
```

### Verification (After)
```
📊 Total users: 150
✅ With preferences: 150 (100%)
❌ Without preferences: 0 (0%)
✅ Migration complete!
```

## 🎯 What Gets Added

```javascript
emailNotifications: {
  enabled: true,
  tokenPurchase: true,
  bookNowToken: true,
  amcPayment: true,
  booking: true,
  kyc: true,
  refund: true,
  sharedMember: true
}
```

## ⏱️ Duration

- Small DB (<1K users): ~10-30 seconds
- Medium DB (1K-10K users): ~1-5 minutes
- Large DB (>10K users): ~5-30 minutes

## ✅ Success Checklist

- [ ] Database backed up
- [ ] Verification shows users without preferences
- [ ] Migration runs without errors
- [ ] Verification shows 100% coverage
- [ ] API endpoints work
- [ ] Settings page loads in app
- [ ] Users can save preferences

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Connection error | Check MongoDB is running |
| Some users failed | Run migration again |
| Slow migration | Normal for large databases |
| Preferences not showing | Clear app cache, reload |

## 📞 Need Help?

1. Check `MIGRATION_GUIDE.md` for detailed instructions
2. Check `backend/migrations/README.md` for script details
3. Review error messages in console output
4. Contact development team

---

**Quick Tip:** Always backup before migration!
