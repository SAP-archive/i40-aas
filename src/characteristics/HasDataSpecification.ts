import { EmbeddedDataSpecification } from './interfaces/EmbeddedDataSpecification';
class HasDataSpecification {
    embeddedDataSpecifications: Array<EmbeddedDataSpecification>;
    constructor(obj: HasDataSpecification) {
        this.embeddedDataSpecifications = obj.embeddedDataSpecifications;
    }
}
export { HasDataSpecification };
