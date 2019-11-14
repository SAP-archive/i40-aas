import sinon from "sinon";
import fs from "fs";
import chaiHttp = require("chai-http");
import Axios, { AxiosError } from "axios";



describe('myFunction', function() {
    it('should call the callback function', function() {
      var callback = sinon.spy();
  
      myFunction(true, callback);
  
      sinon.assert.calledOnce(callback);
    });
  });