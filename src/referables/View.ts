import { applyMixins } from '../characteristics/mixins';
import { Referable } from '../characteristics/Referable';
import { Reference } from '../characteristics/interfaces/Reference';
import { Description } from '../characteristics/interfaces/Description';
import { HasDataSpecification } from '../characteristics/HasDataSpecification';
import { HasSemantics } from '../characteristics/HasSemantics';
import { ModelType } from '../characteristics/interfaces/ModelType';
import { EmbeddedDataSpecification } from '../characteristics/interfaces/EmbeddedDataSpecification';
import { KeyElementsEnum } from '../types/KeyElementsEnum';
interface ViewInterface {
    modelType?: ModelType;
    semanticId?: Reference;
    embeddedDataSpecifications?: EmbeddedDataSpecification[];
    idShort: string;
    parent?: Reference;
    category?: string;
    descriptions?: Array<Description>;
    containedElements?: Array<Reference>;
}
class View implements Referable, HasSemantics, HasDataSpecification, ViewInterface {
    getReference(idType?: import('../types/IdTypeEnum').IdTypeEnum): Reference {
        throw new Error('Method not implemented.');
    }
    modelType: ModelType = { name: KeyElementsEnum.View };
    semanticId?: Reference;
    embeddedDataSpecifications: EmbeddedDataSpecification[] = [];
    idShort: string;
    parent?: Reference;
    category?: string;
    descriptions: Array<Description> = [];
    containedElements: Array<Reference> = [];
    constructor(obj: ViewInterface) {
        this.semanticId = obj.semanticId;
        if (obj.embeddedDataSpecifications) this.embeddedDataSpecifications = obj.embeddedDataSpecifications;
        this.idShort = obj.idShort;
        this.parent = obj.parent;
        this.category = obj.category;
        if (obj.descriptions) this.descriptions = obj.descriptions;
        if (obj.containedElements) this.containedElements = obj.containedElements;
    }
}
applyMixins(View, [Referable, HasSemantics, HasDataSpecification]);

export { View };
