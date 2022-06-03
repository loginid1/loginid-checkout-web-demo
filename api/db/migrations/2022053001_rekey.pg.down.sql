
BEGIN;
ALTER TABLE algo_accounts DROP FOREIGN KEY auth_address_fk; 
ALTER TABLE algo_accounts DROP COLUMN auth_address;
ALTER TABLE algo_accounts ALTER COLUMN address text;
COMMIT;