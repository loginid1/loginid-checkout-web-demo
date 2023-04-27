BEGIN;

ALTER TABLE user_passes ADD id UUID DEFAULT gen_random_uuid();
ALTER TABLE user_passes ADD name TEXT;
ALTER TABLE user_passes ADD data_hash BYTEA;
ALTER TABLE user_passes ADD CONSTRAINT user_passes_pk PRIMARY KEY (id);

COMMIT;
