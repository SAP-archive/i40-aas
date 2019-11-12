The data manager acts as a router that forwards requests to the responsible storage adapter services.

# Data-manager

API available at the server under `/api-docs`

## Running

- To start: `npm run dev` from the this directory
- A GET on `localhost:4000/health` returns a "Server Up!"


### Testing:
Technologies:
- [Mocha](https://mochajs.org/) : Testing Framework
- [Chai](https://www.chaijs.com/): Assertion library
- [Nock](https://github.com/nock/nock) : Mocking External HTTP Requests in Node Tests 

### Environment Variables

Adapter Registry Access:
```
- ADAPTER_REG_URL : The endpoint for retrieving the an adapter from adapter-registry
- ADAPTER_REG_ADMIN_USER : Basic Auth credentials of the adapter-registry
- ADAPTER_REG_ADMIN_PASS : Basic Auth credentials of the adapter-registry
```

Basic Auth:
```
- DATA_MANAGER_USER :  Basic Auth for data-manager service
- DATA_MANAGER_PASSWORD : Basic Auth for the data-manager serice
```