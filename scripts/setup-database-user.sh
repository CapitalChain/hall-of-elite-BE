#!/bin/bash

# Script to set up PostgreSQL user and database permissions

echo "🔧 Setting up PostgreSQL user and database..."

# Check if using default postgres user or creating a new one
USER_TYPE=${1:-postgres}

if [ "$USER_TYPE" = "postgres" ]; then
  echo "📌 Using default 'postgres' user"
  DB_USER="postgres"
  DB_PASSWORD="123"
else
  echo "📌 Creating dedicated user: $USER_TYPE"
  DB_USER=$USER_TYPE
  DB_PASSWORD=${2:-"changeme123"}

  # Create user
  psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User might already exist"
fi

# Grant database privileges
echo "🔐 Granting database privileges..."
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE capitalchain_mt5 TO $DB_USER;" 2>/dev/null

# Grant schema privileges
echo "🔐 Granting schema privileges..."
psql -U postgres -d capitalchain_mt5 -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null
psql -U postgres -d capitalchain_mt5 -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;" 2>/dev/null
psql -U postgres -d capitalchain_mt5 -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;" 2>/dev/null

echo ""
echo "✅ Database user setup complete!"
echo ""
echo "📝 Your DATABASE_URL should be:"
echo "   postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/capitalchain_mt5?schema=public"
echo ""
echo "💡 Update your .env file with the above connection string"
