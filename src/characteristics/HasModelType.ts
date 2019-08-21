import { ModelType } from './interfaces/ModelType';

class HasModelType {
    modelType: ModelType;
    constructor(obj: HasModelType) {
        this.modelType = obj.modelType;
    }
}
export { HasModelType };
