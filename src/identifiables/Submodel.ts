import { HasDataSpecification } from '../characteristics/HasDataSpecification';
import { HasKind } from '../characteristics/HasKind';
import { HasModelType } from '../characteristics/HasModelType';
import { HasSemantics } from '../characteristics/HasSemantics';
import { Identifiable } from '../characteristics/Identifiable';
import { AdministrativeInformation } from '../characteristics/interfaces/AdministrativeInformation';
import { Constraint } from '../characteristics/interfaces/Constraint';
import { Description } from '../characteristics/interfaces/Description';
import { EmbeddedDataSpecification } from '../characteristics/interfaces/EmbeddedDataSpecification';
import { Identifier } from '../characteristics/interfaces/Identifier';
import { ModelType } from '../characteristics/interfaces/ModelType';
import { Reference } from '../characteristics/interfaces/Reference';
import { applyMixins } from '../characteristics/mixins';
import { Qualifiable } from '../characteristics/Qualifiable';
import { Property } from '../referables/Property';
import { SubmodelElement } from '../referables/SubmodelElement';
import { SubmodelElementCollection } from '../referables/SubmodelElementCollection';
import { KeyElementsEnum } from '../types/KeyElementsEnum';
import { KindEnum } from '../types/KindEnum';
import { MultiLanguageProperty } from '../referables/MultiLanguageProperty';
import { Operation } from '../referables/Operation';

interface SubmodelInterface {
    qualifiers?: Array<Constraint>;
    modelType?: ModelType;
    idShort: string;
    parent?: Reference;
    category?: string;
    descriptions?: Array<Description>;
    identification: Identifier;
    administration?: AdministrativeInformation;
    kind?: KindEnum;
    semanticId?: Reference;
    embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
    submodelElements?: Array<SubmodelElement>;
}
class Submodel implements HasModelType, Identifiable, HasKind, HasSemantics, HasDataSpecification, Qualifiable {
    getReference(): Reference {
        throw new Error('Method not implemented.');
    }
    qualifiers?: Array<Constraint> = [];
    modelType: ModelType = { name: KeyElementsEnum.Submodel };
    idShort: string;
    parent?: Reference;
    category?: string;
    descriptions: Array<Description> = [];
    identification: Identifier;
    administration?: AdministrativeInformation;
    kind: KindEnum = KindEnum.Instance;
    semanticId?: Reference;
    embeddedDataSpecifications: Array<EmbeddedDataSpecification> = [];
    submodelElements: Array<SubmodelElement> = [];
    constructor(obj: SubmodelInterface) {
        if (obj.qualifiers) this.qualifiers = obj.qualifiers;
        this.idShort = obj.idShort;
        this.parent = obj.parent;
        this.category = obj.category;
        if (obj.descriptions) this.descriptions = obj.descriptions;
        this.identification = obj.identification;
        this.administration = obj.administration;
        if (obj.kind) this.kind = obj.kind;
        this.semanticId = obj.semanticId;
        if (obj.embeddedDataSpecifications) this.embeddedDataSpecifications = obj.embeddedDataSpecifications;
        if (obj.submodelElements) this.submodelElements = obj.submodelElements;
    }
    getSubmodelElements(): Array<SubmodelElement> {
        return this.submodelElements;
    }

    getSubmodelIdShort(): string {
        return this.idShort;
    }
    setSubmodelElements(submodelElements: Array<SubmodelElement>) {
        var that = this;
        this.submodelElements = [];
        submodelElements.forEach(function(submodelElement: SubmodelElement) {
            that.addSubmodelElement(submodelElement);
        });
    }
    public addSubmodelElement(submodelElement: SubmodelElement) {
        submodelElement.parent = this.getReference();
        if (submodelElement.modelType != null) {
            if (submodelElement.modelType.name === KeyElementsEnum.Property) {
                let submodelElementTemp: Property = <Property>submodelElement;
                this.submodelElements.push(new Property(submodelElementTemp));
            } else if (submodelElement.modelType.name === KeyElementsEnum.SubmodelElementCollection) {
                this.submodelElements.push(new SubmodelElementCollection(submodelElement));
            } else if (submodelElement.modelType.name === KeyElementsEnum.MultiLanguageProperty) {
                this.submodelElements.push(new MultiLanguageProperty(submodelElement));
            } else if (submodelElement.modelType.name === KeyElementsEnum.Operation) {
                let submodelElementTemp: Operation = <Operation>submodelElement;
                this.submodelElements.push(new Operation(submodelElementTemp));
            } else {
                throw new Error('Only Property and SubmodelElementCollection are supported submodelElements');
            }
        } else {
            throw new Error(
                `Modeltype property of element with shortid: ${submodelElement.idShort} is null or undefined `,
            );
        }
    }

    public getSubmodelElementByIdShort(idShort: string): SubmodelElement {
        let res: SubmodelElement | undefined = this.submodelElements.find((submodelElement: SubmodelElement) => {
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
            qualifiers: this.qualifiers,
            idShort: this.idShort,
            parent: this.parent,
            modelType: this.modelType,
            category: this.category,
            descriptions: this.descriptions,
            identification: this.identification,
            administration: this.administration,
            kind: this.kind,
            semanticId: this.semanticId,
            embeddedDataSpecifications: this.embeddedDataSpecifications,
            submodelElements: this.submodelElements,
        };
    }
}
applyMixins(Submodel, [HasModelType, Identifiable, HasKind, HasSemantics, HasDataSpecification, Qualifiable]);

export { Submodel, SubmodelInterface };
