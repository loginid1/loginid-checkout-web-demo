BEGIN;

CREATE TABLE IF NOT EXISTS keystores (
    id uuid,
    iat timestamp NOT NULL DEFAULT current_timestamp,
    alg  VARCHAR(8) NOT NULL DEFAULT 'ES256',
    public_key TEXT NOT NULL,
    private_key TEXT NOT NULL,
    keystore_type TEXT,
    scope INTEGER NOT NULL DEFAULT 0,
    status INTEGER NOT NULL DEFAULT 0, 
    CONSTRAINT keystores_id_pkey PRIMARY KEY(id)
);

COMMIT;