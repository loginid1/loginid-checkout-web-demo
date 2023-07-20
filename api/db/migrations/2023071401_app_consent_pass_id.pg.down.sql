BEGIN;

DROP INDEX app_user_pass_consents_idx;
DROP INDEX app_consents_passid_idx;

ALTER TABLE app_consents DROP pass_id;
ALTER TABLE app_consents DROP schema;

CREATE UNIQUE INDEX IF NOT EXISTS app_user_consents_idx on app_consents (app_id,user_id);

COMMIT;
