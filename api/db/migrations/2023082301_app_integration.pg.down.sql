BEGIN;

CREATE INDEX IF EXISTS app_integrations_appid_idx;
DROP TABLE app_integrations;

COMMIT;
