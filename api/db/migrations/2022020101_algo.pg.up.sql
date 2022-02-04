BEGIN;
CREATE TABLE IF NOT EXISTS algo_accounts (
    id uuid,
    user_id uuid NOT NULL,
    iat timestamp DEFAULT current_timestamp,
    uat timestamp DEFAULT current_timestamp,
    alias text NOT NULL,
    address text NOT NULL,
    teal_script text NOT NULL,
    compile_script text NOT NULL,
    account_status varchar(64) NOT NULL DEFAULT 'new',
    credentials text NOT NULL,
    recovery_address text,
    CONSTRAINT algo_accounts_pkey PRIMARY KEY(id),
    CONSTRAINT algo_accounts_user_id_fk
      FOREIGN KEY(user_id) 
	  REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS algo_accounts_user_id_idx on algo_accounts (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS algo_accounts_address_idx on algo_accounts (address);


COMMIT;