BEGIN;

CREATE TABLE IF NOT EXISTS dev_apps (
    id uuid,
    app_name TEXT NOT NULL,
    app_url TEXT,
    status INTEGER NOT NULL DEFAULT 0, 
    iat timestamp NOT NULL DEFAULT current_timestamp,
    uat timestamp NOT NULL DEFAULT current_timestamp,
    CONSTRAINT dev_apps_id_pkey PRIMARY KEY(id)
);

COMMIT;