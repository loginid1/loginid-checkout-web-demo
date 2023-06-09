BEGIN;

ALTER TABLE user_passes ADD key_id UUID;
ALTER TABLE user_passes ADD masked_data TEXT;

COMMIT;
