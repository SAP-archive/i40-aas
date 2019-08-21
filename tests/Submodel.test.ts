import { Submodel } from '../src/identifiables/Submodel';
import { expect } from 'chai';
import { IdTypeEnum } from '../src/types/IdTypeEnum';
import { KeyElementsEnum } from '../src/types/KeyElementsEnum';
import { CountryCodeEnum } from '../src/types/CountryCodeEnum';
import { SubmodelElement } from '../src/referables/SubmodelElement';
import { Property } from '../src/referables/Property';
import { ValueTypeEnum } from '../src/types/ValueTypeEnum';

describe('Construct Submodel', function() {
  it('create an Submodel', function() {
    let submodel = new Submodel({
      identification: {
        id: 'http://sap.com/customer/2',
        idType: IdTypeEnum.URI
      },
      modelType: {
        name: KeyElementsEnum.Submodel
      },
      embeddedDataSpecifications: [],
      descriptions: [
        {
          language: CountryCodeEnum.Germany,
          text: 'VWS eines Kundensystems'
        }
      ],
      idShort: 'customer2',
      administration: {
        revision: '0.0.0',
        version: '0.0.1'
      },
      submodelElements: [new SubmodelElement({ modelType: { name: KeyElementsEnum.Property }, idShort: 'test' })]
    });
    expect(Object.keys(submodel)).to.include.members(['identification', 'idShort', 'kind', 'submodelElements', 'modelType']);
  });
});

describe('Access submodelElements via getter', function() {
  it('gets submodelElements', function() {
    let submodel = new Submodel({
      identification: {
        id: 'http://sap.com/customer/2',
        idType: IdTypeEnum.URI
      },
      modelType: {
        name: KeyElementsEnum.Submodel
      },
      embeddedDataSpecifications: [],
      descriptions: [
        {
          language: CountryCodeEnum.Germany,
          text: 'VWS eines Kundensystems'
        }
      ],
      idShort: 'customer2',
      administration: {
        revision: '0.0.0',
        version: '0.0.1'
      },
      submodelElements: [new Property({ idShort: 'test', valueType: { dataObjectType: { name: ValueTypeEnum.string } } })]
    });
    console.log(submodel);
    expect(submodel.submodelElements)
      .to.be.an('array')
      .with.length(1);
  });
});

describe('Get SubmodelElement by idShort', function() {
  it('returns a submodelElement by idShort', function() {
    let submodel = new Submodel({
      identification: {
        id: 'http://sap.com/customer/2',
        idType: IdTypeEnum.URI
      },
      modelType: {
        name: KeyElementsEnum.Submodel
      },
      embeddedDataSpecifications: [],
      descriptions: [
        {
          language: CountryCodeEnum.Germany,
          text: 'VWS eines Kundensystems'
        }
      ],
      idShort: 'customer2',
      administration: {
        revision: '0.0.0',
        version: '0.0.1'
      },
      submodelElements: [new Property({ idShort: 'test', valueType: { dataObjectType: { name: ValueTypeEnum.string } } })]
    });
    expect(submodel.getSubmodelElementByIdShort('test')).to.have.all.keys(Object.keys(new Property({ idShort: 'test', valueType: { dataObjectType: { name: ValueTypeEnum.string } } })));
  });
});
