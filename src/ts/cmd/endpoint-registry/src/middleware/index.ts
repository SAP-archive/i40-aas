import { handleLogRequest, handleCors, handleBodyRequestParsing, handleCompression, handleBasicAuth } from './common';

export default [handleLogRequest, handleCors, handleBodyRequestParsing, handleCompression, handleBasicAuth];
