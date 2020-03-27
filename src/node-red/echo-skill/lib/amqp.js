"use strict";
exports.__esModule = true;
var amqp = require("amqp-ts");
var fs = require("fs");
var getos = require("getos");
var util = require("util");
var getOsPromise = util.promisify(getos);
var osDistroLowerCase;
var defaultCaFileLocation = "/etc/ssl/certs/ca-certificates.crt";
module.exports = function (RED) {
    "use strict";
    var exchangeTypes = ["direct", "fanout", "headers", "topic"];
    function initialize(node) {
        if (node.server) {
            node.status({ fill: "green", shape: "ring", text: "connecting" });
            // Get the OS information before connecting initially
            getOsPromise().then(function (result) {
                // windows and macos don't have 'dist'
                var os = result.dist ? result.dist : result.os;
                osDistroLowerCase = os.toLowerCase();
                return node.server.claimConnection();
            }, function (err) {
                console.error(err);
            })
                .then(function () {
                // node.ioType is a string with the following meaning:
                // "0": direct exchange
                // "1": fanout exchange
                // "2": headers exchange
                // "3": topic exchange
                // "4": queue
                if (node.ioType === "4") {
                    node.src = node.server.connection.declareQueue(node.ioName);
                }
                else {
                    node.src = node.server.connection.declareExchange(node.ioName, exchangeTypes[node.ioType]);
                }
                node.src.initialized.then(function () {
                    node.status({ fill: "green", shape: "dot", text: "connected" });
                    // execute node specific initialization
                    node.initialize();
                })["catch"](function (err) {
                    node.status({ fill: "red", shape: "dot", text: "connect error" });
                    node.error("AMQP " + node.amqpType + " node connect error: " + err.message);
                });
            })["catch"](function (err) {
                node.status({ fill: "red", shape: "dot", text: "connect error" });
                node.error("AMQP " + node.amqpType + " node connect error: " + err.message);
            });
            node.on("close", function () {
                node.src.close().then(function () {
                    node.server.freeConnection();
                    node.status({ fill: "red", shape: "ring", text: "disconnected" });
                })["catch"](function (err) {
                    node.server.freeConnection();
                    node.status({ fill: "red", shape: "dot", text: "disconnect error" });
                    node.error("AMQP " + node.amqpType + " node disconnect error: " + err.message);
                });
            });
        }
        else {
            node.status({ fill: "red", shape: "dot", text: "error" });
            node.error("AMQP " + node.amqpType + " error: missing AMQP server configuration");
        }
    }
    //
    //-- AMQP IN ------------------------------------------------------------------
    //
    function AmqpIn(n) {
        var node = this;
        RED.nodes.createNode(node, n);
        node.source = n.source;
        node.topic = n.topic;
        node.ioType = n.iotype;
        node.ioName = n.ioname;
        node.server = RED.nodes.getNode(n.server);
        // set amqp node type initialization parameters
        node.amqpType = "input";
        node.src = null;
        // node specific initialization code
        node.initialize = function () {
            function Consume(msg) {
                node.send({
                    topic: node.topic || msg.fields.routingKey,
                    payload: msg.getContent(),
                    amqpMessage: msg
                });
            }
            node.src.activateConsumer(Consume, { noAck: true }).then(function () {
                node.status({ fill: "green", shape: "dot", text: "connected" });
            })["catch"](function (e) {
                node.status({ fill: "red", shape: "dot", text: "error" });
                node.error("AMQP input error: " + e.message);
            });
        };
        initialize(node);
    }
    //
    //-- AMQP OUT -----------------------------------------------------------------
    //
    function AmqpOut(n) {
        var node = this;
        RED.nodes.createNode(node, n);
        node.source = n.source;
        node.topic = n.routingkey;
        node.ioType = n.iotype;
        node.ioName = n.ioname;
        node.server = RED.nodes.getNode(n.server);
        // set amqp node type initialization parameters
        node.amqpType = "output";
        node.src = null;
        // node specific initialization code
        node.initialize = function () {
            node.on("input", function (msg) {
                var message;
                if (msg.payload) {
                    message = new amqp.Message(msg.payload, msg.options);
                }
                else {
                    message = new amqp.Message(msg);
                }
                message.sendTo(node.src, node.topic || msg.topic);
            });
        };
        initialize(node);
    }
    //
    //-- AMQP SERVER --------------------------------------------------------------
    //
    function AmqpServer(n) {
        var node = this;
        RED.nodes.createNode(node, n);
        // Store local copies of the node configuration (as defined in the .html)
        node.host = n.host || "localhost";
        node.port = n.port || "5672";
        node.vhost = n.vhost;
        node.keepAlive = n.keepalive;
        node.useTls = n.usetls;
        node.useTopology = n.usetopology;
        node.topology = n.topology;
        node.useca = n.useca;
        node.ca = n.ca || null;
        node.clientCount = 0;
        node.connectionPromise = null;
        node.connection = null;
        node.claimConnection = function () {
            if (node.clientCount === 0) {
                // Create the connection url for the AMQP server
                var urlType = node.useTls ? "amqps://" : "amqp://";
                var credentials = "";
                if (node.credentials.user) {
                    credentials = node.credentials.user + ":" + node.credentials.password + "@";
                }
                var urlLocation = node.host + ":" + node.port;
                if (node.vhost) {
                    urlLocation += "/" + node.vhost;
                }
                if (node.keepAlive) {
                    urlLocation += "?heartbeat=" + node.keepAlive;
                }
                var opt = {
                    ca: []
                };
                // We only need to OS check for TLS connections
                if (node.useTls) {
                    if (node.useca) {
                        node.log("Using custom CA file: " + node.ca);
                        opt.ca = fs.readFileSync(node.ca);
                    }
                    else {
                        // FUTURE: This block should be locating the proper ca-cert for this distro.
                        if (osDistroLowerCase.includes("ubuntu") || osDistroLowerCase.includes("alpine")) {
                            node.log("Ubuntu or Alpine OS detected, using CA file: " + defaultCaFileLocation);
                            opt.ca = fs.readFileSync(defaultCaFileLocation);
                        }
                        else { // Alternate OS's would need else-if blocks here
                            node.log("Unable to determine the local distro, defaulting to CA file: " + defaultCaFileLocation);
                            opt.ca = fs.readFileSync(defaultCaFileLocation);
                        }
                    }
                }
                else {
                    node.log("Initializing in-clear AMQP connection");
                }
                node.connection = new amqp.Connection(urlType + credentials + urlLocation, opt);
                // Wait for initialization
                node.connectionPromise = node.connection.initialized.then(function () {
                    node.log("Connected to AMQP server " + urlType + urlLocation);
                })["catch"](function (e) {
                    node.error("AMQP-SERVER error: " + e.message);
                });
                // Create topology
                if (node.useTopology) {
                    try {
                        var topology = JSON.parse(node.topology);
                    }
                    catch (e) {
                        node.error("AMQP-SERVER error creating topology: " + e.message);
                    }
                    node.connectionPromise = node.connection.declareTopology(topology)["catch"](function (e) {
                        node.error("AMQP-SERVER error creating topology: " + e.message);
                    });
                }
            }
            node.clientCount++;
            return node.connectionPromise;
        };
        node.freeConnection = function () {
            node.clientCount--;
            if (node.clientCount === 0) {
                node.connection.close().then(function () {
                    node.connection = null;
                    node.connectionPromise = null;
                    node.log("AMQP server connection " + node.host + " closed");
                })["catch"](function (e) {
                    node.error("AMQP-SERVER error closing connection: " + e.message);
                });
            }
        };
    }
    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("amqp in", AmqpIn);
    RED.nodes.registerType("amqp out", AmqpOut);
    RED.nodes.registerType("amqp-server", AmqpServer, {
        credentials: {
            user: { type: "text" },
            password: { type: "password" }
        }
    });
};
