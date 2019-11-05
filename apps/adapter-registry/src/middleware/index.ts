import { handleCors, handleBodyRequestParsing, handleCompression, handleBasicAuth } from './common';

import { handleAPIDocs } from "./apiDocs";


export default [handleCors, handleBodyRequestParsing, 
    handleCompression, handleBasicAuth, handleAPIDocs];
  