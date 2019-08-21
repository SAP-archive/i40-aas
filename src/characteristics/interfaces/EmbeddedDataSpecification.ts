import { Reference } from './Reference';

interface EmbeddedDataSpecification {
    hasDataSpecification: Reference;
    dataSpecificationContent: object;
}

export { EmbeddedDataSpecification };
