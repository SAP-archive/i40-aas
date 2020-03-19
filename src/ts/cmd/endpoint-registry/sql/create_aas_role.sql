
CREATE TABLE public.aas_role
(
    "aasId" character varying(1024) COLLATE pg_catalog."default" NOT NULL,
    "roleId" character varying(1024) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "uniqueAssignment" PRIMARY KEY ("aasId", "roleId"),
    CONSTRAINT "aasId" FOREIGN KEY ("aasId")
        REFERENCES public.asset_administration_shells ("aasId") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
            CONSTRAINT "roleId" FOREIGN KEY ("roleId")
        REFERENCES public.roles ("roleId") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.roles
    OWNER to postgres;
