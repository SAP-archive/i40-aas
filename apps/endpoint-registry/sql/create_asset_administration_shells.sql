
CREATE TABLE public.asset_administration_shells
(
    "aasId" character varying(1024) COLLATE pg_catalog."default" NOT NULL,
    "idType" character varying(128) COLLATE pg_catalog."default" NOT NULL,
    "assetId" character varying(1024) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT asset_administration_shells_pkey PRIMARY KEY ("aasId"),
    CONSTRAINT "assetId" FOREIGN KEY ("assetId")
        REFERENCES public.assets ("assetId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.asset_administration_shells
    OWNER to postgres;

