import { AssetAdministrationShell } from '../src/identifiables/AssetAdministrationShell';
import { AssetAdministrationShellEnv } from '../src/AssetAdministrationShellEnv';
import { expect } from 'chai';
import { IdTypeEnum } from '../src/types/IdTypeEnum';
import { KeyElementsEnum } from '../src/types/KeyElementsEnum';
import { CountryCodeEnum } from '../src/types/CountryCodeEnum';
import * as fs from 'fs';
import testEnv from './testEnv.json';
describe('Construct AssetAdministrationShellEnv', function() {
  it('create an AssetAdministrationShellEnv By JSON', function() {
    let aasEnv = new AssetAdministrationShellEnv(<AssetAdministrationShellEnv>(<unknown>testEnv));
    console.log(JSON.stringify(aasEnv));
    //fs.writeFileSync('./result.json', JSON.stringify(aasEnv, null, 3));
    expect(Object.keys(aasEnv)).to.have.members(['assetAdministrationShells', 'submodels', 'conceptDescriptions', 'assets']);
    expect(Object.keys(aasEnv.assetAdministrationShells)).to.have.length(1);
    expect(Object.keys(aasEnv.submodels)).to.have.length(1);
  });
});

describe('Get Instance', function() {
  it('Get the instance by its reference', function() {
    let aasEnv = new AssetAdministrationShellEnv(<AssetAdministrationShellEnv>(<unknown>testEnv));
    let submodel = aasEnv.getInstance({
      keys: [
        {
          idType: IdTypeEnum.URI,
          type: KeyElementsEnum.Submodel,
          value: 'sap.com/aas/submodels/part-100-device-information-model/10JF-1234-Jf14-PP22',
          local: true
        }
      ]
    });
    expect(Object.keys(submodel)).to.include.members(['identification', 'idShort', 'kind', 'submodelElements', 'modelType']);
  });
});
