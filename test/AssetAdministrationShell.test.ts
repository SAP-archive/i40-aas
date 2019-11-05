import { AssetAdministrationShell } from '../src/identifiables/AssetAdministrationShell';
import { expect } from 'chai';
import { IdTypeEnum } from '../src/types/IdTypeEnum';
import { KeyElementsEnum } from '../src/types/KeyElementsEnum';
import { CountryCodeEnum } from '../src/types/CountryCodeEnum';

describe('Construct AssetAdministrationShell', function() {
  it('create an AssetAdministrationShell', function() {
    let aas = new AssetAdministrationShell({
      identification: {
        id: 'http://sap.com/customer/2',
        idType: IdTypeEnum.URI
      },
      modelType: {
        name: KeyElementsEnum.AssetAdministrationShell
      },
      embeddedDataSpecifications: [],
      descriptions: [
        {
          language: CountryCodeEnum.Germany,
          text: 'VWS eines Kundensystems'
        }
      ],
      conceptDictionaries: [],
      submodels: [
        {
          keys: [
            {
              idType: IdTypeEnum.URI,
              type: KeyElementsEnum.Submodel,
              value: 'http://sap.com/order/management/om246063-15a0-4361-bfa7-1g817f91434g0',
              local: true
            }
          ]
        }
      ],
      views: [],
      idShort: 'customer2',
      administration: {
        revision: '0.0.0',
        version: '0.0.1'
      }
    });
    expect(Object.keys(aas)).to.include.members(['asset', 'identification', 'submodels', 'security', 'modelType']);
  });
});

describe('Get a Reference to the aas', function() {
  it('generate a Reference', function() {
    let aas = new AssetAdministrationShell({
      identification: {
        id: 'http://sap.com/customer/2',
        idType: IdTypeEnum.URI
      },
      modelType: {
        name: KeyElementsEnum.AssetAdministrationShell
      },
      embeddedDataSpecifications: [],
      descriptions: [
        {
          language: CountryCodeEnum.Germany,
          text: 'VWS eines Kundensystems'
        }
      ],
      conceptDictionaries: [],
      submodels: [
        {
          keys: [
            {
              idType: IdTypeEnum.URI,
              type: KeyElementsEnum.Submodel,
              value: 'http://sap.com/order/management/om246063-15a0-4361-bfa7-1g817f91434g0',
              local: true
            }
          ]
        }
      ],
      views: [],
      idShort: 'customer2',
      administration: {
        revision: '0.0.0',
        version: '0.0.1'
      }
    });
    console.log(aas.getReference());
    expect(Object.keys(aas.getReference())).to.have.members(['keys']);
  });
});
