BEGIN;

ALTER TABLE user_passes DROP key_id;
ALTER TABLE user_passes DROP masked_data;

COMMIT;