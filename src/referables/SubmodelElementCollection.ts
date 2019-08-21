import { applyMixins } from '../characteristics/mixins';
import { Reference } from '../characteristics/interfaces/Reference';
import { Description } from '../characteristics/interfaces/Description';
import { ModelType } from '../characteristics/interfaces/ModelType';
import { HasModelType } from '../characteristics/HasModelType';
import { EmbeddedDataSpecification } from '../characteristics/interfaces/EmbeddedDataSpecification';
import { KindEnum } from '../types/KindEnum';
import { SubmodelElement } from './SubmodelElement';
import { KeyElementsEnum } from '../types/KeyElementsEnum';
import { Property } from './Property';
import { MultiLanguageProperty } from './MultiLanguageProperty';
import { Operation } from './Operation';
interface SubmodelElementCollectionInterface {
    kind?: KindEnum;
    semanticId?: Reference;
    embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
    idShort: string;
    parent?: Reference;
    category?: string;
    descriptions?: Array<Description>;
    value?: Array<SubmodelElement>;
    ordered?: boolean;
    allowDuplicates?: boolean;
}
class SubmodelElementCollection implements HasModelType, SubmodelElement {
    getReference(idType?: import('../types/IdTypeEnum').IdTypeEnum): Reference {
        throw new Error('Method not implemented.');
    }
    kind: KindEnum = KindEnum.Instance;
    semanticId?: Reference;
    embeddedDataSpecifications: Array<EmbeddedDataSpecification> = [];
    modelType: ModelType = { name: KeyElementsEnum.SubmodelElementCollection };
    idShort: string;
    parent?: Reference;
    category?: string;
    descriptions: Array<Description> = [];
    value: Array<SubmodelElement> = [];
    ordered: boolean = false;
    allowDuplicates: boolean = true;

    constructor(obj: SubmodelElementCollectionInterface) {
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
    setValue(values: Array<SubmodelElement>) {
        this.value = [];
        var that = this;
        values.forEach(function(value) {
            that.addValue(value);
        });
    }
    /*public addValue(value: SubmodelElement) {
    if (this.value.indexOf(value) >= 0 && this.allowDuplicates == false) {
      throw new Error('You can not add an object multiple times with allowDuplicates == false');
    }
    value.parent = this.getReference();
    this.value.push(value);
  }*/

    public addValue(submodelElement: SubmodelElement) {
        submodelElement.parent = this.getReference();
        if (submodelElement.modelType != null) {
            if (submodelElement.modelType.name === KeyElementsEnum.Property) {
                let submodelElementTemp: Property = <Property>submodelElement;
                this.value.push(new Property(submodelElementTemp));
            } else if (submodelElement.modelType.name === KeyElementsEnum.SubmodelElementCollection) {
                this.value.push(new SubmodelElementCollection(submodelElement));
            } else if (submodelElement.modelType.name === KeyElementsEnum.MultiLanguageProperty) {
                this.value.push(new MultiLanguageProperty(submodelElement));
            } else if (submodelElement.modelType.name === KeyElementsEnum.Operation) {
                let submodelElementTemp: Operation = <Operation>submodelElement;
                this.value.push(new Operation(submodelElementTemp));
            } else {
                throw new Error('Only Property and SubmodelElementCollection are supported submodelElements');
            }
        } else {
            throw new Error(
                `Modeltype property of element with shortid: ${submodelElement.idShort} is null or undefined `,
            );
        }
    }

    public getValueByIdShort(idShort: string): SubmodelElement {
        let res: SubmodelElement | undefined = this.value.find((submodelElement: SubmodelElement) => {
            if (submodelElement.idShort == idShort) {
                return true;
            } else {
                return false;
            }
        });
        if (res) {
            return res;
        } else {
            throw new Error('SubmodelElement with idShort ' + idShort + ' not found');
        }
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
applyMixins(SubmodelElementCollection, [HasModelType, SubmodelElement]);

export { SubmodelElementCollection };
