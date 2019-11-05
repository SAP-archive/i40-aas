import { expect } from 'chai';
import * as AAS_OBJECTS from '../index';
import { validate } from '../src/validator';
describe('Validate JSON data', function() {
  it('returns no error if the validation was successfull', function() {
    const aasenv = new AAS_OBJECTS.AssetAdministrationShellEnv({ submodels: [], assetAdministrationShells: [], conceptDescriptions: [], assets: [] });
    const valid = validate(aasenv);
    expect(valid.errors).to.be.empty;
  });
});
describe('Validate JSON data', function() {
  it('returns errors if the validation was not successfull', function() {
    const valid = validate({ subsmodels: [], assetAdministratisonShells: [], conceptDescrisptions: [], assets: [] });
    expect(valid.errors).to.be.not.empty;
  });
});
