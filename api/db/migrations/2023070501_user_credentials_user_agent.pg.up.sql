BEGIN;

ALTER TABLE user_credentials ADD user_agent JSONB;

COMMIT;
