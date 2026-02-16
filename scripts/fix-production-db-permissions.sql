-- Fix "permission denied for schema public" for Prisma migrate deploy.
-- Run as postgres (or another superuser) on the server:
--   psql -U postgres -d hall_of_elite -f scripts/fix-production-db-permissions.sql
--
-- If your app user is not hall_user, replace hall_user below and run.

GRANT USAGE ON SCHEMA public TO hall_user;
GRANT CREATE ON SCHEMA public TO hall_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hall_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hall_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO hall_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO hall_user;
