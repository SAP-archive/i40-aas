import { applyMixins } from '../characteristics/mixins';
import { Identifiable } from '../characteristics/Identifiable';
import { ModelType } from '../characteristics/interfaces/ModelType';
import { Reference } from '../characteristics/interfaces/Reference';
import { Identifier } from '../characteristics/interfaces/Identifier';
import { AdministrativeInformation } from '../characteristics/interfaces/AdministrativeInformation';
import { HasDataSpecification } from '../characteristics/HasDataSpecification';
import { HasKind } from '../characteristics/HasKind';
import { KindEnum } from '../types/KindEnum';
import { EmbeddedDataSpecification } from '../characteristics/interfaces/EmbeddedDataSpecification';
import { KeyElementsEnum } from '../types/KeyElementsEnum';
import { Description } from '../characteristics/interfaces/Description';

interface AssetInterface {
    modelType?: ModelType;
    kind?: KindEnum;
    embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
    idShort?: string;
    parent?: Reference;
    category?: string;
    descriptions?: Array<Description>;
    identification: Identifier;
    administration?: AdministrativeInformation;
    assetIdentificationModel?: Reference;
}

class Asset implements Identifiable, HasDataSpecification, HasKind {
    getReference(): Reference {
        throw new Error('Method not implemented.');
    }
    modelType: ModelType = { name: KeyElementsEnum.Asset };
    kind: KindEnum = KindEnum.Instance;
    embeddedDataSpecifications: Array<EmbeddedDataSpecification> = [];
    idShort?: string;
    parent?: Reference;
    category?: string;
    descriptions: Array<Description> = [];
    identification: Identifier;
    administration?: AdministrativeInformation;
    assetIdentificationModel?: Reference;

    constructor(obj: AssetInterface) {
        if (obj.kind) this.kind = obj.kind;
        if (obj.embeddedDataSpecifications) this.embeddedDataSpecifications = obj.embeddedDataSpecifications;
        this.idShort = obj.idShort;
        this.parent = obj.parent;
        this.category = obj.category;
        if (obj.descriptions) this.descriptions = obj.descriptions;
        this.identification = obj.identification;
        this.administration = obj.administration;
        this.assetIdentificationModel = obj.assetIdentificationModel;
    }
}

applyMixins(Asset, [Identifiable, HasDataSpecification, HasKind]);

export { Asset, AssetInterface };
