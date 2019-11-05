import healthRoutes from "./health/routes";
import mongodbClientRoutes from "./mongodb-client/routes";

export default [...healthRoutes, ...mongodbClientRoutes];
