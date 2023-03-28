BEGIN;


BEGIN;

CREATE TABLE IF NOT EXISTS app_consents (
    user_id uuid NOT NULL,
    app_id uuid NOT NULL,
    alias TEXT NOT NULL DEFAULT '',
    attributes TEXT NOT NULL DEFAULT '',
    status INTEGER NOT NULL DEFAULT 0, 
    uat timestamp NOT NULL DEFAULT current_timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS app_user_consents_idx on app_consents (app_id,user_id);
CREATE UNIQUE INDEX IF NOT EXISTS app_consents_alias_idx on app_consents (app_id, alias);


COMMIT;