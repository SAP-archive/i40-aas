import healthRoutes from './health/routes';
import registryRoutes from './registry/routes';

export default [...healthRoutes, ...registryRoutes];
