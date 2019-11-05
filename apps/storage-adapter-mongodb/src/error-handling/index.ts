import { handleBoomErrors, handleParserErrors } from "./common";

//the order is important
export default [handleParserErrors, handleBoomErrors];
