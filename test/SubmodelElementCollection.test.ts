import { Submodel } from '../src/identifiables/Submodel';
import { expect } from 'chai';
import { IdTypeEnum } from '../src/types/IdTypeEnum';
import { KeyElementsEnum } from '../src/types/KeyElementsEnum';
import { CountryCodeEnum } from '../src/types/CountryCodeEnum';
import { SubmodelElement } from '../src/referables/SubmodelElement';
import { Property } from '../src/referables/Property';
import { ValueTypeEnum } from '../src/types/ValueTypeEnum';
import { SubmodelElementCollection } from '../src/referables/SubmodelElementCollection';

describe('Construct SubmodelElementCollection', function() {
  it('create an Submodel', function() {
    let submodelElementCollection = new SubmodelElementCollection({ idShort: 'test' });

    expect(Object.keys(submodelElementCollection)).to.include.members(['idShort', 'allowDuplicates', 'ordered', 'modelType', 'value', 'kind']);
  });
});

describe('Get SubmodelElement by idShort', function() {
  it('returns a submodelElement by idShort', function() {
    let submodelElementCollection = new SubmodelElementCollection({
      descriptions: [
        {
          language: CountryCodeEnum.Germany,
          text: 'some collection'
        }
      ],
      idShort: 'testCollection',
      value: [new Property({ idShort: 'test', valueType: { dataObjectType: { name: ValueTypeEnum.string } } })]
    });
    expect(submodelElementCollection.getValueByIdShort('test')).to.have.all.keys(Object.keys(new Property({ idShort: 'test', valueType: { dataObjectType: { name: ValueTypeEnum.string } } })));
  });
});
