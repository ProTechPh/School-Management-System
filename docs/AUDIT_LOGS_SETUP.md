# Audit Logs Setup Guide

Quick guide to get the audit logs feature up and running.

## Step 1: Run Database Migration

Apply the migration to create indexes and views:

```bash
# If using Supabase CLI
supabase db push

# Or apply manually
psql $DATABASE_URL < supabase/migrations/20260108_audit_logs_indexes.sql
```

This will:
- Create indexes on `auth.audit_log_entries` for better performance
- Create a view `public.audit_logs_with_users` that joins audit logs with user information
- Grant necessary permissions

## Step 2: Verify Audit Logs are Enabled

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Configuration**
3. Find **Audit Logs** section
4. Ensure "Disable writing auth audit logs to project database" is **OFF** (unchecked)

## Step 3: Access the Admin Dashboard

Navigate to `/admin/audit-logs` in your application to view:
- All authentication events
- Analytics dashboard
- Security alerts
- Export functionality

## Step 4: Test the Feature

1. **Login/Logout** - These actions will be logged
2. **Change Password** - Go to change password page
3. **View Logs** - Check `/admin/audit-logs` to see the events
4. **View Profile** - Check your profile page to see your personal audit history

## Step 5: Configure Notifications (Optional)

To enable real-time security alerts:

```typescript
// In your app layout or auth initialization
import { startAuditMonitoring } from "@/lib/audit-monitor"

// Start monitoring for admins
if (userRole === "admin") {
  startAuditMonitoring(userId, userRole)
}
```

## Features Available

### For Admins:
- ✅ View all audit logs
- ✅ Filter by user, action, date, IP
- ✅ Export to CSV
- ✅ View analytics dashboard
- ✅ Receive security alerts

### For All Users:
- ✅ View own authentication history
- ✅ Monitor account security
- ✅ See recent login attempts

## API Endpoints

All endpoints are ready to use:

- `GET /api/audit-logs` - Fetch logs with filters
- `GET /api/audit-logs/stats` - Get statistics (admin only)
- `GET /api/audit-logs/export` - Export to CSV (admin only)

## Troubleshooting

### No logs appearing?
1. Check if audit logs are enabled in Supabase dashboard
2. Verify migration was applied successfully
3. Try logging in/out to generate test events

### Permission errors?
1. Ensure user has correct role (admin for full access)
2. Check that RLS policies are correctly set
3. Verify the view `audit_logs_with_users` exists

### Performance issues?
1. Ensure indexes were created
2. Use date range filters
3. Enable pagination

## Next Steps

- Review the full documentation in `docs/AUDIT_LOGS.md`
- Customize the analytics dashboard
- Set up automated alerts
- Configure log retention policies

## Support

For issues or questions:
1. Check the full documentation
2. Review Supabase Auth Audit Logs docs
3. Check the migration file for SQL details
