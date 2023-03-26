BEGIN;

CREATE TABLE IF NOT EXISTS dev_apps (
    id uuid,
    app_name TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    attributes TEXT NOT NULL DEFAULT '' ,
    origins TEXT NOT NULL DEFAULT '',
    status INTEGER NOT NULL DEFAULT 0, 
    iat timestamp NOT NULL DEFAULT current_timestamp,
    uat timestamp NOT NULL DEFAULT current_timestamp,
    CONSTRAINT dev_apps_id_pkey PRIMARY KEY(id)
);

create index dev_apps_owner_origin_idx on dev_apps (owner_id, origins);

COMMIT;