import { applyMixins } from '../characteristics/mixins';
import { Referable } from '../characteristics/Referable';
import { Reference } from '../characteristics/interfaces/Reference';
import { Description } from '../characteristics/interfaces/Description';
import { ModelType } from '../characteristics/interfaces/ModelType';
import { HasKind } from '../characteristics/HasKind';
import { HasSemantics } from '../characteristics/HasSemantics';
import { HasDataSpecification } from '../characteristics/HasDataSpecification';
import { HasModelType } from '../characteristics/HasModelType';
import { ValueTypeEnum } from '../types/ValueTypeEnum';
import { EmbeddedDataSpecification } from '../characteristics/interfaces/EmbeddedDataSpecification';
import { KindEnum } from '../types/KindEnum';
import { DataType } from '../types/DataType';
import { KeyElementsEnum } from '../types/KeyElementsEnum';
import { SubmodelElement } from './SubmodelElement';
interface OperationVariableInterface {
    kind?: KindEnum;
    semanticId?: Reference;
    embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
    modelType?: ModelType;
    idShort: string;
    parent?: Reference;
    category?: string;
    descriptions?: Array<Description>;
    value?: SubmodelElement;
}
class OperationVariable implements HasModelType, SubmodelElement {
    getReference(idType?: import('../types/IdTypeEnum').IdTypeEnum): Reference {
        throw new Error('Method not implemented.');
    }
    semanticId?: Reference;
    kind: KindEnum = KindEnum.Type;
    embeddedDataSpecifications: Array<EmbeddedDataSpecification> = [];
    modelType: ModelType = { name: KeyElementsEnum.OperationVariable };
    idShort: string;
    parent?: Reference;
    category?: string;
    descriptions: Array<Description> = [];
    valueId?: Reference;
    value?: SubmodelElement;
    constructor(obj: OperationVariableInterface) {
        var that = this;
        if (obj.semanticId) this.semanticId = obj.semanticId;
        if (obj.embeddedDataSpecifications) this.embeddedDataSpecifications = obj.embeddedDataSpecifications;
        this.idShort = obj.idShort;
        this.parent = obj.parent;
        this.category = obj.category;
        if (obj.descriptions) this.descriptions = obj.descriptions;
        this.value = obj.value;
    }
}
applyMixins(OperationVariable, [HasModelType, SubmodelElement]);

export { OperationVariable };
