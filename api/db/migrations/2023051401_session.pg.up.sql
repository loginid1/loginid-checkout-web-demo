BEGIN;

ALTER TABLE app_consents ADD login_at timestamp DEFAULT current_timestamp;

CREATE TABLE IF NOT EXISTS app_user_sessions (
    id uuid,
    user_id uuid,
    app_id uuid,
    version varchar(32),
    data bytea,
    uat timestamp DEFAULT current_timestamp,
    CONSTRAINT app_user_consents_id_pkey PRIMARY KEY (id)

);

  
CREATE INDEX IF NOT EXISTS app_consents_userid_idx on app_consents (user_id);
CREATE INDEX IF NOT EXISTS app_consents_appid_idx on app_consents (app_id);
COMMIT;
