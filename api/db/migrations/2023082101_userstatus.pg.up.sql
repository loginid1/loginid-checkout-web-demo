BEGIN;

ALTER TABLE users ADD status integer DEFAULT 1;

COMMIT;

BEGIN;
update users set status = 1 where exists (select id from user_credentials where user_credentials.user_id = users.id);
COMMIT;
