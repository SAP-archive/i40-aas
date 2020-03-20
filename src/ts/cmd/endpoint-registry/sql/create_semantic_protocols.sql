
CREATE TABLE public.semantic_protocols
(
    "protocolId" character varying(1024) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT semantic_protocols_pkey PRIMARY KEY ("protocolId")
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.semantic_protocols
    OWNER to postgres;
