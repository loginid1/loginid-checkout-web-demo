BEGIN;

CREATE TABLE IF NOT EXISTS app_integrations (
    id      UUID NOT NULL,
    app_id      UUID NOT NULL,
    vendor        VARCHAR(64) NOT NULL,
    settings    JSONB,
    keystore    JSONB,
    schema      TEXT NOT NULL,
    iat  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    uat  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);


CREATE INDEX IF NOT EXISTS app_integrations_appid_idx on app_integrations (app_id);

COMMIT;
