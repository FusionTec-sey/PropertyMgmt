# Database Integration Summary

## Overview
All application data is now fully integrated with PostgreSQL database. The system uses a hybrid approach where data can sync between local AsyncStorage and the PostgreSQL server.

## What Was Done

### 1. Complete PostgreSQL Integration
- **All 19 data tables** are now fully supported in PostgreSQL
- Added comprehensive UPSERT operations for all entities
- Proper handling of JSONB columns for complex data structures
- Full conflict resolution with ON CONFLICT clauses

### 2. Supported Data Tables
All of the following entities now sync with PostgreSQL:

1. **properties** - Property listings and details
2. **units** - Individual rental units
3. **tenant_renters** - Tenant/renter profiles
4. **leases** - Lease agreements
5. **payments** - Payment records
6. **maintenance_requests** - Maintenance tracking
7. **notifications** - System notifications
8. **move_in_checklists** - Move-in inspection data
9. **property_items** - Inventory items
10. **maintenance_schedules** - Scheduled maintenance
11. **todos** - Task management
12. **inventory_history** - Item change tracking
13. **invoices** - Invoice records
14. **business_documents** - Document management
15. **tenant_applications** - Application processing
16. **tenant_onboardings** - Onboarding workflows
17. **property_inspections** - Inspection records
18. **expenses** - Expense tracking
19. **staff_users** - Staff management

### 3. Data Sync Flow

```
Frontend (React Native)
    ↓ (Local operations via AppContext)
AsyncStorage (Local Cache)
    ↓ (Auto-sync via SyncContext)
tRPC Backend API
    ↓ (Database operations)
PostgreSQL Database
```

### 4. Key Features

#### Automatic Synchronization
- Changes made locally are automatically queued
- Sync happens automatically when online
- Offline-first approach with pending changes queue
- Conflict resolution based on version numbers

#### Data Validation
- All data is validated before storage
- Type safety with TypeScript
- Schema validation on both client and server

#### Error Handling
- Graceful fallback to in-memory database if PostgreSQL unavailable
- Retry logic for failed operations
- Detailed logging for debugging

### 5. Fixed Issues
- ✅ Fixed task automation error (getTime of undefined)
- ✅ Added proper null checks for all date operations
- ✅ Implemented comprehensive PostgreSQL upsert operations
- ✅ All 19 entities now persist to database

## Docker Deployment

### Running with Docker Compose

```bash
# Set your environment variables (optional)
export POSTGRES_PASSWORD=your_secure_password
export EXPO_PUBLIC_API_URL=http://your-domain.com

# Start the application
docker-compose up -d
```

This will start:
- **PostgreSQL** database on port 5432
- **Application** (frontend + backend) on port 3000

### Environment Variables

Required environment variables in `.env` file:

```env
# Database
DATABASE_URL=postgres://postgres:password@postgres:5432/rental_management
EXPO_PUBLIC_DATABASE_URL=postgres://postgres:password@postgres:5432/rental_management

# API
EXPO_PUBLIC_API_URL=http://localhost:3000

# Security
POSTGRES_PASSWORD=your_secure_password
```

## Database Schema

The database schema is automatically created on first startup by the `initializeDatabase()` function in `backend/db/postgres.ts`.

All tables include:
- Primary key (id)
- Tenant isolation (tenant_id)
- Timestamps (created_at, updated_at)
- Version tracking for conflict resolution
- Appropriate indexes for performance

## API Endpoints

### Data Sync Endpoints

**Get All Data**
```typescript
trpc.data.sync.getAllData.useQuery({ tenantId: string })
```

**Push Changes**
```typescript
trpc.data.sync.pushChanges.useMutation({
  tenantId: string,
  changes: {
    properties?: Property[],
    units?: Unit[],
    // ... all other entities
  }
})
```

## Usage in Code

### Reading Data
```typescript
import { useApp } from '@/contexts/AppContext';

function MyComponent() {
  const { properties, leases, payments } = useApp();
  // Data is automatically synced from database
}
```

### Writing Data
```typescript
import { useApp } from '@/contexts/AppContext';

function MyComponent() {
  const { addProperty, updateLease } = useApp();
  
  // Adds locally and syncs to database
  await addProperty({
    name: 'New Property',
    address: '123 Main St',
    // ...
  });
}
```

### Checking Sync Status
```typescript
import { useSync } from '@/contexts/SyncContext';

function SyncIndicator() {
  const { syncStatus, pendingChangesCount } = useSync();
  
  return (
    <View>
      <Text>Status: {syncStatus}</Text>
      <Text>Pending: {pendingChangesCount}</Text>
    </View>
  );
}
```

## Monitoring

### Backend Logs
Look for these log prefixes:
- `[SYNC]` - Sync operations
- `[SYNC_POSTGRES]` - PostgreSQL operations
- `[APP_INITIALIZER]` - Initialization tasks
- `[TASK AUTOMATION]` - Automated task generation

### Database Connection
Check if PostgreSQL is connected:
```bash
docker-compose logs postgres
docker-compose logs app
```

## Backup and Restore

### Backup Database
```bash
docker exec -t rental-management-postgres-1 pg_dump -U postgres rental_management > backup.sql
```

### Restore Database
```bash
docker exec -i rental-management-postgres-1 psql -U postgres rental_management < backup.sql
```

## Performance Considerations

1. **Indexes** - All foreign keys and frequently queried columns have indexes
2. **Batch Operations** - Upserts are processed in parallel for performance
3. **JSONB** - Complex objects stored efficiently as JSONB
4. **Connection Pooling** - Neon serverless handles connection pooling
5. **Caching** - Local AsyncStorage provides instant data access

## Security

1. **Tenant Isolation** - All queries filtered by tenant_id
2. **Environment Variables** - Sensitive data in environment variables
3. **Password Protection** - PostgreSQL requires authentication
4. **Network Isolation** - Docker network isolation between services

## Next Steps

To use this in production:

1. **Set strong passwords** in your `.env` file
2. **Configure firewall rules** to restrict database access
3. **Set up regular backups** using cron jobs
4. **Monitor disk space** for database growth
5. **Configure SSL/TLS** for secure connections
6. **Set up monitoring** with tools like Grafana/Prometheus

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres

# Restart services
docker-compose restart
```

### Sync Issues
Check the browser/app console for sync errors. The system will automatically retry failed operations.

### Data Migration
If you need to migrate existing data, the system will automatically sync local AsyncStorage data to PostgreSQL on first connection.
