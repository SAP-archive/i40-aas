import { handleCors, handleBodyRequestParsing, handleCompression, handleBasicAuth } from './common';

export default [handleCors, handleBodyRequestParsing, handleCompression, handleBasicAuth];
