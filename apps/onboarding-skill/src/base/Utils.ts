class Utils {
  static logRequestError(error: any, logger: any) {
    if (error.response) {
      /*
       * The request was made and the server responded with a
       * status code that falls out of the range of 2xx
       */
      logger.debug(
        'The request was made and the server responded with a status code that falls out of the range of 2xx'
      );
      logger.debug('Status ' + error.response.status);
      logger.debug('Headers ' + error.response.headers);
    } else if (error.request) {
      /*
       * The request was made but no response was received, `error.request`
       * is an instance of XMLHttpRequest in the browser and an instance
       * of http.ClientRequest in Node.js
       */
      logger.debug('The request was made but no response was received');
      logger.debug('Request: ' + error.request); //This might print out the password
    } else {
      // Something happened in setting up the request and triggered an Error
      logger.debug(
        'Something happened in setting up the request and triggered an Error'
      );
      logger.debug('Error', error.message);
    }
    //all relevant fields have been logged, no need to log entire error again
    //logger.debug(error);
  }
}

export { Utils };
