BEGIN;

ALTER TABLE user_passes DROP id;
ALTER TABLE user_passes DROP name;
ALTER TABLE user_passes DROP data_hash;

COMMIT;