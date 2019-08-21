import { applyMixins } from '../characteristics/mixins';
import { Reference } from '../characteristics/interfaces/Reference';
import { Description } from '../characteristics/interfaces/Description';
import { ModelType } from '../characteristics/interfaces/ModelType';
import { HasModelType } from '../characteristics/HasModelType';
import { EmbeddedDataSpecification } from '../characteristics/interfaces/EmbeddedDataSpecification';
import { KindEnum } from '../types/KindEnum';
import { SubmodelElement } from './SubmodelElement';
import { KeyElementsEnum } from '../types/KeyElementsEnum';
import { LangString } from '../characteristics/interfaces/LangString';
import { DataType } from '../types/DataType';
import { ValueTypeEnum } from '../types/ValueTypeEnum';
interface MultiLanguagePropertyInterface {
    kind?: KindEnum;
    semanticId?: Reference;
    embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
    idShort: string;
    parent?: Reference;
    category?: string;
    descriptions?: Array<Description>;
    value?: Array<LangString>;
    ordered?: boolean;
    allowDuplicates?: boolean;
}
class MultiLanguageProperty implements HasModelType, SubmodelElement, MultiLanguagePropertyInterface {
    getReference(idType?: import('../types/IdTypeEnum').IdTypeEnum): Reference {
        throw new Error('Method not implemented.');
    }
    valueType: DataType = { dataObjectType: { name: ValueTypeEnum.langString } };
    kind: KindEnum = KindEnum.Instance;
    semanticId?: Reference;
    embeddedDataSpecifications: Array<EmbeddedDataSpecification> = [];
    modelType: ModelType = { name: KeyElementsEnum.MultiLanguageProperty };
    idShort: string;
    parent?: Reference;
    category?: string;
    descriptions: Array<Description> = [];
    value: Array<LangString> = [];
    ordered: boolean = false;
    allowDuplicates: boolean = true;

    constructor(obj: MultiLanguagePropertyInterface) {
        if (obj.kind) this.kind = obj.kind;
        this.semanticId = obj.semanticId;
        if (obj.embeddedDataSpecifications) this.embeddedDataSpecifications = obj.embeddedDataSpecifications;
        this.idShort = obj.idShort;
        this.parent = obj.parent;
        this.category = obj.category;
        if (obj.descriptions) this.descriptions = obj.descriptions;
        if (obj.value) this.value = obj.value;
        if (obj.ordered) this.ordered = obj.ordered;
        if (obj.allowDuplicates) this.allowDuplicates = obj.allowDuplicates;
    }

    getValue() {
        return this.value;
    }
    setValue(values: Array<LangString>) {
        this.value = [];
        var that = this;
        values.forEach(function(value) {
            that.addValue(value);
        });
    }
    public addValue(value: LangString) {
        this.value.push(value);
    }

    toJSON() {
        return {
            idShort: this.idShort,
            parent: this.parent,
            category: this.category,
            descriptions: this.descriptions,
            kind: this.kind,
            modelType: this.modelType,
            semanticId: this.semanticId,
            embeddedDataSpecifications: this.embeddedDataSpecifications,
            value: this.value,
            ordered: this.ordered,
            allowDuplicates: this.allowDuplicates,
        };
    }
}
applyMixins(MultiLanguageProperty, [HasModelType, SubmodelElement]);

export { MultiLanguageProperty };
