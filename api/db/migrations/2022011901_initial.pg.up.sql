BEGIN;
CREATE TABLE IF NOT EXISTS users (
    id uuid,
    iat timestamp DEFAULT current_timestamp,
    username text NOT NULL,
    username_lower text GENERATED ALWAYS AS (lower(username)) STORED, 
    CONSTRAINT users_id_pkey PRIMARY KEY(id)
);

CREATE INDEX IF NOT EXISTS users_username_idx on users (username);
CREATE INDEX IF NOT EXISTS users_username_lower_idx on users (username_lower);

CREATE TABLE IF NOT EXISTS user_credentials (
    id uuid,
    user_id uuid,
    key_handle text NOT NULL,
    public_key text NOT NULL,
    key_alg text NOT NULL,
    name text,
    iat timestamp DEFAULT current_timestamp,
    CONSTRAINT user_credentials_id PRIMARY KEY(id),
    CONSTRAINT user_credentials_user_id_fk
      FOREIGN KEY(user_id) 
	  REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS user_credentials_user_id_idx on user_credentials (user_id);

CREATE TABLE IF NOT EXISTS user_recovery (
    id uuid,
    user_id uuid,
    public_key text NOT NULL, 
    iat timestamp DEFAULT current_timestamp,
    CONSTRAINT user_recovery_id PRIMARY KEY(id),
    CONSTRAINT user_recovery_user_id_fk
      FOREIGN KEY(user_id) 
	  REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS user_recovery_user_id_idx on user_recovery (user_id);

COMMIT;