import { applyMixins } from '../characteristics/mixins';
import { Reference } from '../characteristics/interfaces/Reference';
import { Description } from './interfaces/Description';
import { HasModelType } from './HasModelType';
import { ModelType } from './interfaces/ModelType';
import { IdTypeEnum } from '../types/IdTypeEnum';
import { KeyElementsEnum } from '../types/KeyElementsEnum';
class Referable implements HasModelType {
    modelType: ModelType;
    idShort?: string;
    parent?: Reference;
    category?: string;
    descriptions: Array<Description> = [];
    constructor(obj: Referable) {
        this.modelType = obj.modelType;
        this.idShort = obj.idShort;
        this.parent = obj.parent;
        this.category = obj.category;
        this.descriptions = obj.descriptions;
    }

    getReference(): Reference {
        let keys = [];
        let index = 0;
        let rootKey = {
            idType: IdTypeEnum.IdShort,
            type: this.modelType.name,
            value: this.idShort,
            local: true,
        };

        keys.push(rootKey);
        if (this.parent) {
            this.parent.keys.forEach(function(key) {
                var newKey = key;
                keys.push(newKey);
            });
        }
        return {
            keys: keys,
        };
    }
}

export { Referable };
