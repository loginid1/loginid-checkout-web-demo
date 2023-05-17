BEGIN;

ALTER TABLE app_consents DROP login_at;
DROP TABLE IF EXISTS app_user_consents; 

DROP INDEX IF EXISTS app_consents_userid_idx ;
DROP INDEX IF EXISTS app_consents_appid_idx ;
COMMIT;