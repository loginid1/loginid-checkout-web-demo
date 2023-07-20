BEGIN;

DROP INDEX app_user_consents_idx;

ALTER TABLE app_consents ADD pass_id UUID;
ALTER TABLE app_consents ADD schema TEXT;

CREATE INDEX IF NOT EXISTS app_consents_passid_idx on app_consents (pass_id);
CREATE UNIQUE INDEX IF NOT EXISTS app_user_pass_consents_idx on app_consents (app_id,user_id,pass_id);

COMMIT;
