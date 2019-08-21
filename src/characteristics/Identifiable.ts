import { applyMixins } from '../characteristics/mixins';
import { Reference } from '../characteristics/interfaces/Reference';
import { Referable } from './Referable';
import { Identifier } from './interfaces/Identifier';
import { AdministrativeInformation } from './interfaces/AdministrativeInformation';
import { ModelType } from './interfaces/ModelType';
import { Description } from './interfaces/Description';
import { IdTypeEnum } from '../types/IdTypeEnum';
import { Key } from './interfaces/Key';
interface IdentifiableInterface {
    modelType: ModelType;
    idShort?: string;
    parent?: Reference;
    category?: string;
    descriptions?: Description[];
    identification: Identifier;
    administration?: AdministrativeInformation;
}
class Identifiable implements Referable, Identifiable {
    getReference(): Reference {
        let keys: Array<Key> = [];
        let rootKey = {
            type: this.modelType.name,
            idType: this.identification.idType,
            value: this.identification.id,
            local: true,
            index: 0,
        };

        keys.push(rootKey);
        return {
            keys: keys,
        };
    }
    modelType: ModelType;
    idShort?: string;
    parent?: Reference;
    category?: string;
    descriptions: Description[] = [];
    identification: Identifier;
    administration?: AdministrativeInformation;
    constructor(obj: Identifiable) {
        this.modelType = obj.modelType;
        this.idShort = obj.idShort;
        this.parent = obj.parent;
        this.category = obj.category;
        this.descriptions = obj.descriptions;
        this.identification = obj.identification;
        this.administration = obj.administration;
    }
}

export { Identifiable };
