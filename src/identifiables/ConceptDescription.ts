import { applyMixins } from '../characteristics/mixins';
import { HasDataSpecification } from '../characteristics/HasDataSpecification';
import { HasModelType } from '../characteristics/HasModelType';
import { Identifiable } from '../characteristics/Identifiable';
import { EmbeddedDataSpecification } from '../characteristics/interfaces/EmbeddedDataSpecification';
import { ModelType } from '../characteristics/interfaces/ModelType';
import { Reference } from '../characteristics/interfaces/Reference';
import { Identifier } from '../characteristics/interfaces/Identifier';
import { AdministrativeInformation } from '../characteristics/interfaces/AdministrativeInformation';
import { Description } from '../characteristics/interfaces/Description';
import { KeyElementsEnum } from '../types/KeyElementsEnum';

interface ConceptDescriptionInterface {
    embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
    modelType?: ModelType;
    idShort?: string;
    parent?: Reference;
    category?: string;
    descriptions?: Array<Description>;
    identification: Identifier;
    administration?: AdministrativeInformation;
    isCaseOf?: Reference;
}
class ConceptDescription implements HasDataSpecification, HasModelType, Identifiable {
    getReference(): Reference {
        throw new Error('Method not implemented.');
    }
    embeddedDataSpecifications: Array<EmbeddedDataSpecification> = [];
    modelType: ModelType = { name: KeyElementsEnum.ConceptDescription };
    idShort?: string;
    parent?: Reference;
    category?: string;
    descriptions: Array<Description> = [];
    identification: Identifier;
    administration?: AdministrativeInformation;
    isCaseOf?: Reference;
    constructor(obj: ConceptDescriptionInterface) {
        if (obj.embeddedDataSpecifications) this.embeddedDataSpecifications = obj.embeddedDataSpecifications;
        this.idShort = obj.idShort;
        this.parent = obj.parent;
        this.category = obj.category;
        if (obj.descriptions) this.descriptions = obj.descriptions;
        this.identification = obj.identification;
        this.administration = obj.administration;
        this.isCaseOf = obj.isCaseOf;
    }
}
applyMixins(ConceptDescription, [Identifiable, HasDataSpecification, HasModelType]);
export { ConceptDescription, ConceptDescriptionInterface };
