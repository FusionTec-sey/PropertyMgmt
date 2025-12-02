# PostgreSQL Database Setup

This guide explains how to set up PostgreSQL for your rental management app on Hostinger VPS or any PostgreSQL provider.

## Features

- ✅ PostgreSQL database with full schema
- ✅ Automatic fallback to in-memory database
- ✅ Multi-tenant data isolation
- ✅ Optimistic concurrency control with versioning
- ✅ Automatic table creation and indexing

## Quick Start

### 1. Set Up PostgreSQL Database

#### Option A: Hostinger VPS

1. SSH into your Hostinger VPS:
```bash
ssh your_username@your_server_ip
```

2. Install PostgreSQL:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

3. Start PostgreSQL:
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

4. Create database and user:
```bash
sudo -u postgres psql
```

In PostgreSQL shell:
```sql
CREATE DATABASE rental_management;
CREATE USER rental_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE rental_management TO rental_user;
\q
```

5. Configure PostgreSQL to accept connections (if needed):
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```
Set: `listen_addresses = '*'`

```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```
Add: `host all all 0.0.0.0/0 md5`

6. Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

#### Option B: Neon (Serverless Postgres)

1. Go to [neon.tech](https://neon.tech)
2. Create a free account
3. Create a new project
4. Copy the connection string

#### Option C: Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (Connection Pooling → Transaction mode)

### 2. Configure Environment Variable

Add your database URL to your environment:

```bash
# For Hostinger VPS
DATABASE_URL=postgresql://rental_user:your_secure_password@your_server_ip:5432/rental_management

# For Neon
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# For Supabase
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

You can set this in:
- `.env.local` file (for development)
- Your hosting provider's environment variables
- System environment variables

### 3. Start Your App

```bash
npm start
```

The app will:
1. Automatically create all database tables and indexes
2. Connect to PostgreSQL if `DATABASE_URL` is set
3. Fall back to in-memory storage if no database is configured

## Database Schema

The app automatically creates these tables:

- `properties` - Property listings
- `units` - Individual rental units
- `tenant_renters` - Tenant/renter information
- `leases` - Lease agreements
- `payments` - Payment records
- `maintenance_requests` - Maintenance tickets
- `notifications` - System notifications
- `move_in_checklists` - Move-in inspection checklists
- `property_items` - Inventory items
- `maintenance_schedules` - Scheduled maintenance
- `todos` - Task management
- `inventory_history` - Item history tracking
- `invoices` - Invoice records
- `business_documents` - Document management
- `tenant_applications` - Rental applications
- `tenant_onboardings` - Onboarding workflows
- `property_inspections` - Inspection records
- `expenses` - Expense tracking
- `staff_users` - Staff user accounts

## Multi-Tenancy

All tables include a `tenant_id` column for data isolation:
- Each business/organization has a unique tenant ID
- Data is automatically filtered by tenant ID
- No cross-tenant data access is possible

## Data Versioning

All records include a `version` column:
- Prevents lost updates in concurrent scenarios
- Automatically incremented on each update
- Enables optimistic concurrency control

## Connection Details

### Hostinger VPS Connection
```
Host: your_vps_ip
Port: 5432
Database: rental_management
User: rental_user
Password: your_secure_password
```

### Security Notes

1. **Never commit credentials** to version control
2. **Use strong passwords** for database users
3. **Enable SSL/TLS** for production connections
4. **Restrict IP access** via firewall or pg_hba.conf
5. **Regular backups** - Set up automated backups
6. **Keep PostgreSQL updated** for security patches

## Backup & Restore

### Backup
```bash
pg_dump -U rental_user rental_management > backup.sql
```

### Restore
```bash
psql -U rental_user rental_management < backup.sql
```

## Monitoring

Check database connection:
```bash
psql -U rental_user -d rental_management -c "SELECT COUNT(*) FROM properties;"
```

View active connections:
```sql
SELECT * FROM pg_stat_activity;
```

## Troubleshooting

### Database not connecting
- Check `DATABASE_URL` is correctly set
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check firewall allows port 5432
- Verify credentials are correct

### Tables not created
- Check console logs for initialization errors
- Ensure database user has CREATE TABLE privileges
- Try running initialization manually

### Performance issues
- Add more indexes as needed
- Enable connection pooling
- Consider read replicas for high traffic

## Development vs Production

### Development
```bash
# Use in-memory database (no setup needed)
# Don't set DATABASE_URL

# Or use local PostgreSQL
DATABASE_URL=postgresql://localhost:5432/rental_dev
```

### Production
```bash
# Use managed PostgreSQL (Neon, Supabase, etc.)
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
```

## Cost Comparison

| Provider | Free Tier | Paid Plans |
|----------|-----------|------------|
| Neon | 512MB storage, 1 project | From $19/mo |
| Supabase | 500MB storage, 2 projects | From $25/mo |
| Hostinger VPS | Self-hosted | VPS from $4/mo |
| Railway | 512MB RAM, 1GB storage | From $5/mo |

## Next Steps

1. ✅ Set up PostgreSQL database
2. ✅ Configure `DATABASE_URL`
3. ✅ Start the app
4. ☐ Set up automated backups
5. ☐ Configure SSL/TLS
6. ☐ Set up monitoring
7. ☐ Implement connection pooling (for high traffic)

## Support

For issues or questions:
- Check console logs for error messages
- Verify DATABASE_URL format
- Ensure PostgreSQL version >= 12
