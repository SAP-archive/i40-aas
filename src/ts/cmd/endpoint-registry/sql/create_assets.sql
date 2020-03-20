
CREATE TABLE public.assets
(
    "assetId" character varying(1024) COLLATE pg_catalog."default" NOT NULL,
    "idType" character varying(128) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT asset_pkey PRIMARY KEY ("assetId")
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.assets
    OWNER to postgres;
