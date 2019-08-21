import { ModelType } from './ModelType';
import { Reference } from './Reference';

interface Qualifier {
    modelType: ModelType;
    qualifierType: any;
    qualifierValue: any;
    qualifierValueId: Reference;
}

export { Qualifier };
