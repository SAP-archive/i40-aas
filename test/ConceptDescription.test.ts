import { AssetAdministrationShell } from '../src/identifiables/AssetAdministrationShell';
import { expect } from 'chai';
import { IdTypeEnum } from '../src/types/IdTypeEnum';
import { KeyElementsEnum } from '../src/types/KeyElementsEnum';
import { CountryCodeEnum } from '../src/types/CountryCodeEnum';
import { ConceptDescription } from '../src/identifiables/ConceptDescription';

describe('Construct ConceptDescription', function() {
  it('create an ConceptDescription', function() {
    let cd = new ConceptDescription({
      identification: {
        id: 'https://sap.com/conceptDescriptions/throughput',
        idType: IdTypeEnum.URI
      },
      embeddedDataSpecifications: [
        {
          hasDataSpecification: {
            keys: [
              {
                local: true,
                idType: IdTypeEnum.URI,
                type: KeyElementsEnum.GlobalReference,
                value: 'www.admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360'
              }
            ]
          },
          dataSpecificationContent: {
            shortName: 'throughput',
            unit: 'pcs'
          }
        }
      ],
      descriptions: [],
      idShort: 'throughput'
    });
    expect(Object.keys(cd)).to.include.members(['identification', 'modelType']);
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
