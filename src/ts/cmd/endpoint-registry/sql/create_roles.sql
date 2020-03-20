
CREATE TABLE public.roles
(
    "roleId" character varying(1024) COLLATE pg_catalog."default" NOT NULL,
    "protocolId" character varying(1024) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT roles_pkey PRIMARY KEY ("roleId"),
    CONSTRAINT "protocolId" FOREIGN KEY ("protocolId")
        REFERENCES public.semantic_protocols ("protocolId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.roles
    OWNER to postgres;
