BEGIN;

CREATE TABLE symmetric_keystores (
    owner_id       TEXT      NOT NULL
        CONSTRAINT symmetric_keystores_pk
            PRIMARY KEY,
    rotation_s     BIGINT    NOT NULL,
    grace_s        BIGINT    NOT NULL,
    retention_s    BIGINT    NOT NULL,
    current_key_id TEXT,
    rotate_at      TIMESTAMP,
    created_at     TIMESTAMP NOT NULL,
    updated_at     TIMESTAMP NOT NULL
);

CREATE TABLE symmetric_keys (
    id           TEXT      NOT NULL,
    kms_provider TEXT      NOT NULL,
    key_data     bytea     NOT NULL,
    algorithm    TEXT      NOT NULL,
    issued_at    TIMESTAMP NOT NULL,
    deleted_at   TIMESTAMP,
    expires_at   TIMESTAMP NOT NULL,
    owner_id     TEXT      NOT NULL,
    CONSTRAINT symmetric_keys_pk
        PRIMARY KEY (id, kms_provider)
);

ALTER TABLE symmetric_keys
    ADD CONSTRAINT symmetric_keys_owner_id_fk
        FOREIGN KEY (owner_id) REFERENCES symmetric_keystores (owner_id);

COMMIT;
