import { Identifier } from 'i40-aas-objects';


interface IRegistryAssignRolesResultSet {
  aasId: Identifier;
  roleId: string;
}

interface ICreateRoleResultSet{
    roleId: string;
    semanticProtocol: string;
}

class RegistryAssignRolesResultSet implements IRegistryAssignRolesResultSet {
  public aasId: Identifier;
  public roleId: string;

  constructor(aasId: Identifier, roleId: string) {
    this.aasId = aasId;
    this.roleId = roleId;
  }
}
class CreateRoleResultSet implements ICreateRoleResultSet {
  public roleId: string;
    public semanticProtocol: string;

  constructor(aasId: string, semanticProtocol: string) {
    this.roleId = aasId;
    this.semanticProtocol = semanticProtocol;
  }
}

export { IRegistryAssignRolesResultSet as IRegistryRolesResultSet, RegistryAssignRolesResultSet as RegistryRolesResultSet, ICreateRoleResultSet ,CreateRoleResultSet };
