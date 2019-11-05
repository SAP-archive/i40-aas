
SELECT "aasId","URL","protocol_name","protocol_version","roleId" FROM (SELECT *
FROM public.aas_role 
INNER JOIN public.asset_administration_shells 
USING ("aasId")
WHERE "roleId" = (SELECT "roleId" FROM public.roles where 
"protocolId" = 'i40:registry-semanticProtocol/onboarding' and "roleId" = 'Approver'
limit 1)) as res
INNER JOIN public.endpoints
USING("aasId")
