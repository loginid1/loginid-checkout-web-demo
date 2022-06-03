BEGIN;
ALTER TABLE algo_accounts ALTER COLUMN address TYPE CHAR(58);
ALTER TABLE algo_accounts ADD COLUMN auth_address CHAR(58);
ALTER TABLE algo_accounts ADD CONSTRAINT auth_address_fk FOREIGN KEY (auth_address) REFERENCES algo_accounts(address); 
COMMIT;