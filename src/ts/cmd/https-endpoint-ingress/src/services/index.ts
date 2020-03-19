import healthRoutes from "./health/routes";
import endpointRoutes from "./aas-router/routes";

export default [...healthRoutes, ...endpointRoutes];
