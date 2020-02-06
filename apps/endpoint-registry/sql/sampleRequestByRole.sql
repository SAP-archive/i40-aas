
SELECT "aasId", "URL", "protocol_name", "protocol_version", "roleId"
FROM (SELECT *
    FROM public.aas_role
        INNER JOIN public.asset_administration_shells
USING ("aasId")
    WHERE "roleId" = (SELECT "roleId"
    FROM public.roles
    where
"protocolId" = 'i40:registry-semanticProtocol/onboarding' and "roleId" = 'Approver'
limit
1)) as res
INNER JOIN public.endpoints
USING
("aasId")


SELECT public.assets."idType" as "assetIdType", public.assets."assetId", aasWithProtocols."aasId", aasWithProtocols."idType" as "aasIdType", aasWithProtocols."protocol_name" , aasWithProtocols."protocol_version", aasWithProtocols."roleId", aasWithProtocols."URL"
FROM ((SELECT *
    FROM public.aas_role INNER JOIN public.asset_administration_shells USING ("aasId") INNER JOIN public.endpoints USING("aasId")  ) as aasWithProtocols INNER JOIN public.assets USING ("assetId")  ;
