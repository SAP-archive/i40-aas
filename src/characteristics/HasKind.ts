import { KindEnum } from '../types/KindEnum';

class HasKind {
    kind: KindEnum;
    constructor(obj: HasKind) {
        this.kind = obj.kind;
    }
}
export { HasKind };
