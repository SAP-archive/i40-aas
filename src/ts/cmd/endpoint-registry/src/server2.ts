// import express from 'express';


// const app = express();
// //app.use(express.json());

// app.use('/ui', express.static('/cmd/endpoint-registry/ui/i40-aas-registry-ui/webapp'));

// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => {
//     console.log(`Server is listening on port ${PORT}`);
// });



const express = require('express');
const app = express();
//var path = require('path');

var port = 3000;
console.log("Working directory: " + __dirname);

app.use('/', express.static('/cmd'));


app.listen(port);
console.log('connected to port '+ port);






// // Define the requirements
// const express = require('express');
// const path = require('path');
// const app = express();

// // Define the port the web server will listen to
// app.set('port', 8081);

// // Use Express to serve the static assets
// app.use(express.static(path.join(__dirname, '../www')));
// console.log("Working directory: " + __dirname);

// // Start the server and report the port on which it is running
// const server = app.listen(app.get('port'), function() {
//   console.log('The server is running on: ' + app.get('port'));
// });