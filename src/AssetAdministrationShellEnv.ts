import { applyMixins } from './characteristics/mixins';
import { AssetAdministrationShell, AssetAdministrationShellInterface } from './identifiables/AssetAdministrationShell';
import { Submodel, SubmodelInterface } from './identifiables/Submodel';
import { ConceptDescription, ConceptDescriptionInterface } from './identifiables/ConceptDescription';
import { Asset, AssetInterface } from './identifiables/Asset';
import { Reference } from './characteristics/interfaces/Reference';
import { Referable } from './characteristics/Referable';
import { ModelType } from './characteristics/interfaces/ModelType';
import { Key } from './characteristics/interfaces/Key';
import { Identifiable } from './characteristics/Identifiable';
interface AssetAdministrationShellEnvInterface {
    assetAdministrationShells: Array<AssetAdministrationShell>;
    submodels: Array<Submodel>;
    conceptDescriptions: Array<ConceptDescription>;
    assets: Array<Asset>;
}
class AssetAdministrationShellEnv implements AssetAdministrationShellEnvInterface {
    assetAdministrationShells: Array<AssetAdministrationShell> = [];
    submodels: Array<Submodel> = [];
    conceptDescriptions: Array<ConceptDescription> = [];
    assets: Array<Asset> = [];

    constructor(obj: AssetAdministrationShellEnvInterface) {
        this.assetAdministrationShells = obj.assetAdministrationShells;
        this.submodels = obj.submodels;
        this.conceptDescriptions = obj.conceptDescriptions;
        this.assets = obj.assets;
    }
    setAssetAdministrationShells(assetAdministrationShellsIn: Array<AssetAdministrationShell>) {
        this.assetAdministrationShells = [];
        var that = this;
        assetAdministrationShellsIn.forEach(assetAdministrationShell => {
            that.addAssetAdministrationShell(assetAdministrationShell);
        });
    }

    getAssetAdministrationShells(): Array<AssetAdministrationShell> {
        return this.assetAdministrationShells;
    }
    addAssetAdministrationShell(assetAdministrationShell: AssetAdministrationShellInterface) {
        this.assetAdministrationShells.push(new AssetAdministrationShell(assetAdministrationShell));
    }
    getSubmodels() {
        return this.submodels;
    }
    setSubmodels(submodels: Array<SubmodelInterface>) {
        this.submodels = [];
        var that = this;
        submodels.forEach(submodel => {
            that.addSubmodel(submodel);
        });
    }
    addSubmodel(submodel: SubmodelInterface) {
        this.submodels.push(new Submodel(submodel));
    }
    getConceptDescriptions() {
        return this.conceptDescriptions;
    }
    setConceptDescriptions(conceptDescriptions: Array<ConceptDescriptionInterface>) {
        this.conceptDescriptions = [];
        var that = this;
        conceptDescriptions.forEach(conceptDescription => {
            that.addConceptDescription(conceptDescription);
        });
    }
    addConceptDescription(conceptDescription: ConceptDescriptionInterface) {
        this.conceptDescriptions.push(new ConceptDescription(conceptDescription));
    }

    getAssets() {
        return this.assets;
    }

    setAssets(assets: Array<AssetInterface>) {
        this.assets = [];
        var that = this;
        assets.forEach(asset => {
            that.addAsset(asset);
        });
    }
    addAsset(asset: AssetInterface) {
        this.assets.push(new Asset(asset));
    }
    getInstance(ref: Reference): Referable {
        var keyChain: Reference = this.getShortestRef(ref);
        var structure: any = this;
        var that = this;
        keyChain.keys.forEach(key => {
            var aggregationName: string = that.getStructureAggregationName(key, structure.modelType);
            structure[aggregationName].some((aggregationElement: Identifiable) => {
                if (structure.modelType && structure.modelType.name) {
                    if (aggregationElement.idShort == key.value) {
                        structure = aggregationElement;
                        return true;
                    }
                } else {
                    if (aggregationElement.identification.id == key.value) {
                        structure = aggregationElement;
                        return true;
                    }
                }
            });
        });
        return structure;
    }
    getStructureAggregationName(key: Key, structureModelType?: ModelType): string {
        var structureModelTypeName = 'AssetAdministrationShellEnv';
        if (structureModelType) {
            structureModelTypeName = structureModelType.name;
        }
        switch (key.type) {
            case 'AssetAdministrationShell':
                return 'assetAdministrationShells';
                break;
            case 'Submodel':
                return 'submodels';
            case 'ConceptDescription':
                return 'conceptDescriptions';
            case 'Property':
                if (structureModelTypeName == 'SubmodelElementCollection') {
                    return 'value';
                } else {
                    return 'submodelElements';
                }
            default:
                throw new Error('Can nit find key type ' + key.type);
        }
    }
    getShortestRef(ref: Reference): Reference {
        var keys = ref.keys;
        if (keys.length <= 1) {
            return ref;
        }
        var newKeys = [];
        for (var j = keys.length - 1; j >= 0; --j) {
            newKeys.push(keys[j]);
            if (keys[j].idType != 'IdShort') {
                break;
            }
        }
        return { keys: newKeys };
    }

    public getSubmodelsByIdShort(idShort: string): Array<Submodel> {
        let res: Array<Submodel> = [];
        this.submodels.forEach((submodel: Submodel) => {
            if (submodel.idShort == idShort) {
                res.push(submodel);
            }
        });
        return res;
    }
    public getSubmodelsBySemanticId(ref: Reference): Array<Submodel> {
        let res: Array<Submodel> = [];
        this.submodels.forEach((submodel: Submodel) => {
            if (
                submodel.semanticId &&
                submodel.semanticId.keys &&
                submodel.semanticId.keys[0] &&
                submodel.semanticId.keys[0].value == ref.keys[0].value
            ) {
                res.push(submodel);
            }
        });
        return res;
    }
    public getConceptDescriptionsByIdShort(idShort: string): Array<ConceptDescription> {
        let res: Array<ConceptDescription> = [];
        this.conceptDescriptions.forEach((conceptDescription: ConceptDescription) => {
            if (conceptDescription.idShort == idShort) {
                res.push(conceptDescription);
            }
        });
        return res;
    }

    public getAssetsByIdShort(idShort: string): Array<Asset> {
        let res: Array<Asset> = [];
        this.assets.forEach((asset: Asset) => {
            if (asset.idShort == idShort) {
                res.push(asset);
            }
        });
        return res;
    }
    toJSON() {
        return {
            assetAdministrationShells: this.assetAdministrationShells,
            submodels: this.submodels,
            conceptDescriptions: this.conceptDescriptions,
            assets: this.assets,
        };
    }
}

export { AssetAdministrationShellEnv };
