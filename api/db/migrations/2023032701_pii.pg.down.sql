BEGIN;

drop index if exists user_passes_user_schema_idx;
drop table if exists user_passes;

COMMIT;