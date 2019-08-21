import { Reference } from './interfaces/Reference';
class HasSemantics {
    semanticId?: Reference;
    constructor(obj: HasSemantics) {
        this.semanticId = obj.semanticId;
    }
}
export { HasSemantics };
