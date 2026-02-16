#!/bin/bash
# Fix "permission denied for schema public" so Prisma migrate deploy can run.
# Run this as PostgreSQL superuser (e.g. postgres) on the production server.
#
# Usage:
#   sudo -u postgres ./scripts/fix-production-db-permissions.sh
#   # Or: psql -U postgres -d hall_of_elite -f - < <(cat scripts/fix-production-db-permissions.sql)

set -e
DB_NAME="${1:-hall_of_elite}"
DB_USER="${2:-hall_user}"

echo "Granting schema public permissions to $DB_USER on database $DB_NAME..."

psql -U postgres -d "$DB_NAME" -v ON_ERROR_STOP=1 <<EOF
-- Allow use of schema public
GRANT USAGE ON SCHEMA public TO $DB_USER;
-- Allow creating tables (required for Prisma migrations)
GRANT CREATE ON SCHEMA public TO $DB_USER;
-- Allow future tables/sequences in public to be used
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
-- If tables already exist, grant on them
GRANT ALL ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
EOF

echo "Done. Run: npx prisma migrate deploy --schema=./src/prisma/schema.prisma"