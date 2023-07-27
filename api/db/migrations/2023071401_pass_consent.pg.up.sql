BEGIN;

CREATE TABLE IF NOT EXISTS pass_consents (
    user_id     UUID NOT NULL,
    app_id      UUID NOT NULL,
    pass_id     UUID NOT NULL,
    schema      TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (app_id,user_id,pass_id)
);

COMMIT;
