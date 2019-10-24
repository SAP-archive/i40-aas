import { applyMixins } from '../characteristics/mixins';
import { Reference } from '../characteristics/interfaces/Reference';
import { Identifiable } from '../characteristics/Identifiable';
import { HasDataSpecification } from '../characteristics/HasDataSpecification';
import { ConceptDescription } from './ConceptDescription';
import { ConceptDictionary } from '../referables/ConceptDictionary';
import { View } from '../referables/View';
import { EmbeddedDataSpecification } from '../characteristics/interfaces/EmbeddedDataSpecification';
import { Identifier } from '../characteristics/interfaces/Identifier';
import { AdministrativeInformation } from '../characteristics/interfaces/AdministrativeInformation';
import { HasModelType } from '../characteristics/HasModelType';
import { ModelType } from '../characteristics/interfaces/ModelType';
import { KeyElementsEnum } from '../types/KeyElementsEnum';
import { Description } from '../characteristics/interfaces/Description';

interface AssetAdministrationShellInterface {
    modelType?: ModelType;
    embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
    idShort?: string;
    parent?: Reference;
    category?: string;
    descriptions?: Array<Description>;
    identification: Identifier;
    administration?: AdministrativeInformation;
    derivedFrom?: Reference;
    security?: any;
    submodels?: Array<Reference>;
    conceptDictionaries?: Array<ConceptDictionary>;
    views?: Array<View>;
    asset?: Reference;
}
class AssetAdministrationShell implements Identifiable, HasDataSpecification, HasModelType {
    getReference(): Reference {
        throw new Error('Method not implemented.');
    }
    public modelType: ModelType = { name: KeyElementsEnum.AssetAdministrationShell };
    public embeddedDataSpecifications: Array<EmbeddedDataSpecification> = [];
    public idShort?: string;
    public parent?: Reference;
    public category?: string;
    public descriptions: Array<Description> = [];
    public identification: Identifier;
    public administration?: AdministrativeInformation;
    public derivedFrom?: Reference;
    public security?: any;
    public submodels: Array<Reference> = [];
    public conceptDictionaries: Array<ConceptDictionary> = [];
    public views?: Array<View>;
    public asset?: Reference;

    constructor(obj: AssetAdministrationShellInterface) {
        if (obj.embeddedDataSpecifications) {
            this.embeddedDataSpecifications = obj.embeddedDataSpecifications;
        }
        this.idShort = obj.idShort;
        this.parent = obj.parent;
        this.category = obj.category;
        if (obj.descriptions) this.descriptions = obj.descriptions;
        this.identification = obj.identification;
        this.administration = obj.administration;
        this.derivedFrom = obj.derivedFrom;
        this.security = obj.security;
        if (obj.submodels) this.submodels = obj.submodels;
        if (obj.conceptDictionaries) this.conceptDictionaries = obj.conceptDictionaries;
        if (obj.views) this.views = obj.views;
        this.asset = obj.asset;
    }

    addSubmodel(submodel: Reference) {
        this.submodels.push(submodel);
    }
    addConceptDictionary(conceptDictionary: ConceptDictionary) {
        this.conceptDictionaries.push(conceptDictionary);
    }
}
applyMixins(AssetAdministrationShell, [Identifiable, HasDataSpecification]);
export { AssetAdministrationShell, AssetAdministrationShellInterface };
