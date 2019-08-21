import { HasModelType } from './HasModelType';
import { ModelType } from './interfaces/ModelType';
import { Constraint } from './interfaces/Constraint';

class Qualifiable {
    qualifiers?: Array<Constraint> = [];
    constructor(obj: Qualifiable) {
        this.qualifiers = obj.qualifiers;
    }
}
export { Qualifiable };
