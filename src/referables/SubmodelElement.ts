import { applyMixins } from '../characteristics/mixins';
import { Referable } from '../characteristics/Referable';
import { Reference } from '../characteristics/interfaces/Reference';
import { Description } from '../characteristics/interfaces/Description';
import { ModelType } from '../characteristics/interfaces/ModelType';
import { HasKind } from '../characteristics/HasKind';
import { HasSemantics } from '../characteristics/HasSemantics';
import { HasDataSpecification } from '../characteristics/HasDataSpecification';
import { HasModelType } from '../characteristics/HasModelType';
import { KindEnum } from '../types/KindEnum';
import { EmbeddedDataSpecification } from '../characteristics/interfaces/EmbeddedDataSpecification';
interface SubmodelElementInterface {
    kind?: KindEnum;
    semanticId?: Reference;
    embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
    modelType: ModelType;
    idShort: string;
    parent?: Reference;
    category?: string;
    descriptions?: Array<Description>;
}
class SubmodelElement implements HasModelType, Referable, HasKind, HasSemantics, HasDataSpecification {
    getReference(idType?: import('../types/IdTypeEnum').IdTypeEnum): Reference {
        throw new Error('Method not implemented.');
    }
    kind: KindEnum = KindEnum.Instance;
    semanticId?: Reference;
    embeddedDataSpecifications: Array<EmbeddedDataSpecification> = [];
    modelType: ModelType;
    idShort: string;
    parent?: Reference;
    category?: string;
    descriptions: Array<Description> = [];
    constructor(obj: SubmodelElementInterface) {
        if (obj.kind) this.kind = obj.kind;
        this.semanticId = obj.semanticId;
        if (obj.embeddedDataSpecifications) this.embeddedDataSpecifications = obj.embeddedDataSpecifications;
        this.modelType = obj.modelType;
        this.idShort = obj.idShort;
        this.parent = obj.parent;
        this.category = obj.category;
        if (obj.descriptions) this.descriptions = obj.descriptions;
    }
}
applyMixins(SubmodelElement, [HasModelType, Referable, HasKind, HasSemantics, HasDataSpecification]);

export { SubmodelElement };
