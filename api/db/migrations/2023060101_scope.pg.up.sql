BEGIN;

ALTER TABLE users ADD scopes text DEFAULT '';

COMMIT;

BEGIN;
update users set scopes = 'algo' where exists (select id from algo_accounts where algo_accounts.user_id = users.id);
update users set scopes = 'developer' where exists (select id from dev_apps where dev_apps.owner_id = users.id::text);
COMMIT;
