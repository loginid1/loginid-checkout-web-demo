BEGIN;
CREATE TABLE IF NOT EXISTS enable_accounts (
    id uuid,
    user_id uuid NOT NULL,
    wallet_address text NOT NULL,
    iat timestamp DEFAULT current_timestamp,
    network varchar(64) NOT NULL,
    dapp_origin TEXT NOT NULL,
    CONSTRAINT enable_accounts_pkey PRIMARY KEY(id),
    CONSTRAINT enable_accounts_user_id_fk
      FOREIGN KEY(user_id) 
	  REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS enable_accounts_wallet_user_idx on enable_accounts (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS enable_accounts_wallet_address_dapp_origin_network_idx on enable_accounts (wallet_address,dapp_origin,network);


COMMIT;