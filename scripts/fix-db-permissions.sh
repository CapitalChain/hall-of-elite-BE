#!/bin/bash

# Script to fix PostgreSQL permissions for capitalchain_mt5 database

echo "🔧 Fixing database permissions for capitalchain_mt5..."

# Grant database privileges
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE capitalchain_mt5 TO postgres;" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ Database privileges granted"
else
  echo "⚠️  Database might not exist. Creating it..."
  psql -U postgres -c "CREATE DATABASE capitalchain_mt5;" 2>/dev/null
  psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE capitalchain_mt5 TO postgres;" 2>/dev/null
fi

# Grant schema privileges
psql -U postgres -d capitalchain_mt5 -c "GRANT ALL ON SCHEMA public TO postgres;" 2>/dev/null
psql -U postgres -d capitalchain_mt5 -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;" 2>/dev/null
psql -U postgres -d capitalchain_mt5 -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;" 2>/dev/null

echo "✅ Schema privileges granted"
echo ""
echo "🎉 Database permissions fixed! Try running 'npm run dev' again."
