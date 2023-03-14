BEGIN;
ALTER TABLE algo_accounts ADD COLUMN teal_version integer DEFAULT 0;
COMMIT;