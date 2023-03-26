BEGIN;


DROP TABLE IF EXISTS app_consents;
DROP INDEX IF EXISTS app_user_consents_idx;
DROP INDEX IF EXISTS app_consents_alias_idx;
COMMIT;