BEGIN;


CREATE TABLE IF NOT EXISTS user_passes (
    user_id uuid NOT NULL,
    attributes TEXT NOT NULL DEFAULT '',
    schema TEXT NOT NULL,
    issuer TEXT NOT NULL,
    data bytea,
    created_at timestamp NOT NULL DEFAULT current_timestamp,
    updated_at timestamp NOT NULL DEFAULT current_timestamp,
    expires_at timestamp DEFAULT current_timestamp
);

CREATE index user_passes_user_schema_idx on user_passes (user_id,schema);


COMMIT;