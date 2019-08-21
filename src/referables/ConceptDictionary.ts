import { applyMixins } from '../characteristics/mixins';
import { Referable } from '../characteristics/Referable';
import { Reference } from '../characteristics/interfaces/Reference';
import { Description } from '../characteristics/interfaces/Description';
import { ModelType } from '../characteristics/interfaces/ModelType';
import { KeyElementsEnum } from '../types/KeyElementsEnum';
interface ConceptDictionaryInterface {
    modelType?: ModelType;
    idShort: string;
    parent?: Reference;
    category?: string;
    descriptions?: Array<Description>;
    conceptDescriptions?: Array<Reference>;
}
class ConceptDictionary implements Referable {
    getReference(idType?: import('../types/IdTypeEnum').IdTypeEnum): Reference {
        throw new Error('Method not implemented.');
    }
    modelType: ModelType = { name: KeyElementsEnum.ConceptDictionary };
    idShort?: string;
    parent?: Reference;
    category?: string;
    descriptions: Array<Description> = [];
    conceptDescriptions: Array<Reference> = [];
    constructor(obj: ConceptDictionaryInterface) {
        this.idShort = obj.idShort;
        this.parent = obj.parent;
        this.category = obj.category;
        if (obj.descriptions) this.descriptions = obj.descriptions;
        if (obj.conceptDescriptions) this.conceptDescriptions = obj.conceptDescriptions;
    }
}

applyMixins(ConceptDictionary, [Referable]);

export { ConceptDictionary };
