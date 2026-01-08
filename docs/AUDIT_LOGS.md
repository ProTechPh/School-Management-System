# Audit Logs Feature Documentation

## Overview

The Audit Logs feature provides comprehensive tracking of authentication events in your Supabase application. It helps monitor user authentication activities, detect suspicious behavior, and maintain compliance with security requirements.

## Features

### 1. Admin Dashboard (`/admin/audit-logs`)
- **View all authentication events** across the system
- **Advanced filtering** by user, action type, date range, and IP address
- **Analytics dashboard** showing login trends, failed attempts, and success rates
- **Security alerts** for suspicious activities
- **CSV export** for compliance and reporting
- **Pagination** for efficient browsing of large datasets

### 2. User Profile Integration
- Users can view their own authentication history
- Shows recent login attempts, password changes, and security events
- Helps users monitor their account security

### 3. Real-time Security Monitoring
- Detects multiple failed login attempts (3+ in 5 minutes)
- Monitors password changes and MFA modifications
- Sends notifications to admins for suspicious activities

### 4. Analytics & Reporting
- Login trends over time
- Failed vs successful authentication attempts
- Most active users
- Top authentication actions
- Success rate calculations

## Database Schema

Audit logs are stored in the `auth.audit_log_entries` table (automatically created by Supabase Auth).

### Key Fields:
- `id`: Unique identifier
- `user_id`: User who performed the action
- `action`: Type of authentication event
- `ip_address`: IP address of the request
- `created_at`: Timestamp of the event
- `payload`: Additional event data (JSON)

### Indexes:
```sql
-- User-based queries
CREATE INDEX idx_audit_log_entries_user_id ON auth.audit_log_entries(user_id);

-- Date range queries
CREATE INDEX idx_audit_log_entries_created_at ON auth.audit_log_entries(created_at DESC);

-- Action filtering
CREATE INDEX idx_audit_log_entries_action ON auth.audit_log_entries(action);

-- Combined user + date queries
CREATE INDEX idx_audit_log_entries_user_created ON auth.audit_log_entries(user_id, created_at DESC);

-- IP-based security monitoring
CREATE INDEX idx_audit_log_entries_ip ON auth.audit_log_entries(ip_address);
```

## Action Types

### Authentication Actions:
- `login` - User login attempt
- `logout` - User logout
- `user_signedup` - New user registration
- `user_repeated_signup` - Duplicate signup attempt

### Account Management:
- `user_modified` - User profile updated
- `user_deleted` - User account deleted
- `user_updated_password` - Password change completed
- `user_recovery_requested` - Password reset requested

### Token Management:
- `token_refreshed` - Refresh token used
- `token_revoked` - Refresh token revoked

### MFA (Multi-Factor Authentication):
- `factor_in_progress` - MFA enrollment started
- `factor_unenrolled` - MFA factor removed
- `challenge_created` - MFA challenge initiated
- `verification_attempted` - MFA verification attempted
- `mfa_code_login` - Login with MFA code
- `generate_recovery_codes` - MFA recovery codes generated

### Identity Management:
- `identity_unlinked` - Identity unlinked from account

## API Endpoints

### GET `/api/audit-logs`
Fetch audit logs with filtering and pagination.

**Query Parameters:**
- `userId` - Filter by user ID
- `action` - Filter by action type
- `startDate` - Filter by start date (ISO format)
- `endDate` - Filter by end date (ISO format)
- `ipAddress` - Filter by IP address
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 50)
- `detectSuspicious` - Check for suspicious activity (boolean)

**Authorization:**
- Admins can view all logs
- Users can only view their own logs

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "action": "login",
      "ip_address": "192.168.1.1",
      "created_at": "2026-01-08T10:00:00Z",
      "payload": {},
      "email": "user@example.com",
      "name": "John Doe",
      "role": "student"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### GET `/api/audit-logs/stats`
Get audit log statistics for the dashboard.

**Query Parameters:**
- `days` - Number of days to analyze (default: 30)

**Authorization:** Admin only

**Response:**
```json
{
  "totalLogins": 1500,
  "failedLogins": 45,
  "successRate": 97,
  "uniqueUsers": 250,
  "recentActions": [
    { "action": "login", "count": 1200 },
    { "action": "token_refreshed", "count": 800 }
  ]
}
```

### GET `/api/audit-logs/export`
Export audit logs to CSV format.

**Query Parameters:** Same as `/api/audit-logs`

**Authorization:** Admin only

**Response:** CSV file download

## Components

### `<AuditLogTable>`
Displays audit logs in a table format with badges for severity levels.

```tsx
import { AuditLogTable } from "@/components/audit-log-table"

<AuditLogTable 
  logs={auditLogs} 
  onRowClick={(log) => console.log(log)} 
/>
```

### `<AuditLogFilters>`
Provides filtering UI for audit logs.

```tsx
import { AuditLogFilters } from "@/components/audit-log-filters"

<AuditLogFilters 
  onFilterChange={(filters) => setFilters(filters)} 
/>
```

### `<AuditLogAnalytics>`
Displays analytics cards with statistics.

```tsx
import { AuditLogAnalytics } from "@/components/audit-log-analytics"

<AuditLogAnalytics stats={stats} />
```

### `<UserAuditHistory>`
Shows user's personal authentication history.

```tsx
import { UserAuditHistory } from "@/components/user-audit-history"

<UserAuditHistory userId={userId} limit={10} />
```

## Utility Functions

### `getAuditLogs(filters)`
Fetch audit logs with filters and pagination.

### `getUserAuditLogs(userId, limit)`
Get audit logs for a specific user.

### `getAuditLogStats(days)`
Calculate statistics for the dashboard.

### `detectSuspiciousActivity(userId?)`
Detect suspicious patterns in recent logs.

### `exportAuditLogsToCSV(logs)`
Convert audit logs to CSV format.

### `getActionDisplayName(action)`
Get human-readable action name.

### `getActionSeverity(action)`
Get severity level: "low", "medium", or "high".

## Security Considerations

1. **Access Control:**
   - Only admins can view all audit logs
   - Users can only view their own logs
   - All API endpoints verify authentication and authorization

2. **Data Privacy:**
   - Sensitive payload data is not exposed in the UI
   - IP addresses are logged for security monitoring
   - Personal information is joined from the users table

3. **Performance:**
   - Indexes optimize common query patterns
   - Pagination prevents loading large datasets
   - View combines audit logs with user data efficiently

4. **Storage:**
   - Logs are stored in Postgres by default
   - Can be disabled to save database space
   - External log storage is always available

## Configuration

### Enable/Disable Database Storage

Navigate to your Supabase project dashboard:
1. Go to **Authentication**
2. Find **Audit Logs** under Configuration
3. Toggle "Disable writing auth audit logs to project database"

**Note:** External log storage remains active even when database storage is disabled.

## Migration

Run the migration to add indexes:

```bash
# Apply the migration
supabase db push

# Or manually run the SQL
psql $DATABASE_URL < supabase/migrations/20260108_audit_logs_indexes.sql
```

## Usage Examples

### Admin Viewing All Logs
```typescript
const { data, pagination } = await getAuditLogs({
  page: 1,
  pageSize: 50,
  startDate: "2026-01-01",
  endDate: "2026-01-31"
})
```

### User Viewing Own History
```typescript
const logs = await getUserAuditLogs(userId, 10)
```

### Detecting Suspicious Activity
```typescript
const alerts = await detectSuspiciousActivity()
// Returns alerts for multiple failed logins, password changes, etc.
```

### Exporting to CSV
```typescript
const csv = exportAuditLogsToCSV(logs)
// Download or save the CSV file
```

## Troubleshooting

### Logs Not Appearing
1. Check if database storage is enabled in Supabase dashboard
2. Verify the migration has been applied
3. Ensure RLS policies allow reading from `auth.audit_log_entries`

### Performance Issues
1. Ensure indexes are created
2. Use pagination for large datasets
3. Apply date range filters to limit results
4. Consider archiving old logs

### Permission Errors
1. Verify user role is correct
2. Check API endpoint authorization logic
3. Ensure service role is used for admin operations

## Future Enhancements

- [ ] Real-time log streaming with WebSockets
- [ ] Advanced analytics with charts and graphs
- [ ] Automated alerting via email/SMS
- [ ] Log retention policies and archiving
- [ ] Integration with external SIEM tools
- [ ] Geolocation mapping for IP addresses
- [ ] Anomaly detection with machine learning

## References

- [Supabase Auth Audit Logs Documentation](https://supabase.com/docs/guides/auth/audit-logs)
- [Supabase Auth API Reference](https://supabase.com/docs/reference/javascript/auth-api)
