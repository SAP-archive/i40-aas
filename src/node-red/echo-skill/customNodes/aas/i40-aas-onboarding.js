var i40 = require('i40-aas-objects');
module.exports = function(RED) {
  function i40_aas_onboarding_node(config) {
    RED.nodes.createNode(this, config);
    this.conversationID = config.conversationID;
    this.senderID = config.senderID;
    this.receiverID = config.receiverID;
    this.submodelID = config.submodelID;
    this.manufacturer = config.manufacturer;
    this.manufactureruri = config.manufactureruri;
    this.model = config.model;
    this.serialnumber = config.serialnumber;
    this.hardwarerevision = config.hardwarerevision;
    this.deviceclass = config.deviceclass;
    this.devicemanual = config.devicemanual;
    this.productinstanceuri = config.productinstanceuri;
    this.productcode = config.productcode;
    this.devicerevision = config.devicerevision;
    this.revisioncounter = config.revisioncounter;
    this.softwarerevision = config.softwarerevision;
    var node = this;

    node.on('input', function(msg) {
      var interactionMsg = msg.payload;
      var conversationID = interactionMsg.conversationID || node.conversationID || new Date().toISOString();
      var senderID = interactionMsg.senderID || node.senderID;
      var receiverID = interactionMsg.receiverID || node.receiverID;
      var submodelID = interactionMsg.submodelID || node.submodelID;
      var manufacturer = interactionMsg.manufacturer || node.manufacturer;
      var manufactureruri = interactionMsg.manufactureruri || node.manufactureruri;
      var model = interactionMsg.model || node.model;
      var serialnumber = interactionMsg.serialnumber || node.serialnumber;
      var hardwarerevision = interactionMsg.hardwarerevision || node.hardwarerevision;
      var deviceclass = interactionMsg.deviceclass || node.deviceclass;
      var devicemanual = interactionMsg.devicemanual || node.devicemanual;
      var productinstanceuri = interactionMsg.productinstanceuri || node.productinstanceuri;
      var productcode = interactionMsg.productcode || node.productcode;
      var devicerevision = interactionMsg.devicerevision || node.devicerevision;
      var revisioncounter = interactionMsg.revisioncounter || node.revisioncounter;
      var softwarerevision = interactionMsg.softwarerevision || node.softwarerevision;

      if (!senderID) {
        throw new Error('senderID is missing');
      }
      if (!submodelID) {
        throw new Error('submodelID is missing');
      }
      if (!productinstanceuri) {
        throw new Error('productinstanceuri is missing');
      }
      msg.payload = {
        frame: {
          semanticProtocol: 'i40:registry-semanticProtocol/onboarding',
          type: 'publishInstance',
          messageId: new Date().getTime(),
          replyBy: 29993912,
          receiver: {
            role: {
              name: 'CentralAssetRepository'
            }
          },
          sender: {
            identification: {
              id: senderID,
              idType: 'IRI '
            },
            role: {
              name: 'Operator'
            }
          },
          conversationId: conversationID
        },
        interactionElements: [
          i40.Submodel.fromJSON({
            qualifiers: [],
            idShort: 'opc-ua-devices',
            modelType: {
              name: 'Submodel'
            },
            descriptions: [],
            identification: {
              id: submodelID,
              idType: 'IRI '
            },
            kind: 'Instance',
            semanticId: {
              keys: [
                {
                  idType: 'IRI ',
                  type: 'GlobalReference',
                  value: 'opcfoundation.org/specifications-unified-architecture/part-100-device-information-model',
                  local: false
                }
              ]
            },
            embeddedDataSpecifications: [],
            submodelElements: [
              {
                kind: 'Instance',
                embeddedDataSpecifications: [],
                modelType: {
                  name: 'Property'
                },
                descriptions: [],
                idShort: 'manufacturer',
                value: manufacturer,
                valueType: {
                  dataObjectType: {
                    name: 'string'
                  }
                }
              },
              {
                kind: 'Instance',
                embeddedDataSpecifications: [],
                modelType: {
                  name: 'Property'
                },
                descriptions: [],
                idShort: 'manufactureruri',
                value: manufactureruri,
                valueType: {
                  dataObjectType: {
                    name: 'string'
                  }
                }
              },
              {
                kind: 'Instance',
                embeddedDataSpecifications: [],
                modelType: {
                  name: 'Property'
                },
                descriptions: [],
                idShort: 'model',
                value: model,
                valueType: {
                  dataObjectType: {
                    name: 'string'
                  }
                }
              },
              {
                kind: 'Instance',
                embeddedDataSpecifications: [],
                modelType: {
                  name: 'Property'
                },
                descriptions: [],
                idShort: 'serialnumber',
                value: serialnumber,
                valueType: {
                  dataObjectType: {
                    name: 'string'
                  }
                }
              },
              {
                kind: 'Instance',
                embeddedDataSpecifications: [],
                modelType: {
                  name: 'Property'
                },
                descriptions: [],
                idShort: 'hardwarerevision',
                value: hardwarerevision,
                valueType: {
                  dataObjectType: {
                    name: 'string'
                  }
                }
              },
              {
                kind: 'Instance',
                embeddedDataSpecifications: [],
                modelType: {
                  name: 'Property'
                },
                descriptions: [],
                idShort: 'deviceclass',
                value: deviceclass,
                valueType: {
                  dataObjectType: {
                    name: 'string'
                  }
                }
              },
              {
                kind: 'Instance',
                embeddedDataSpecifications: [],
                modelType: {
                  name: 'Property'
                },
                descriptions: [],
                idShort: 'devicemanual',
                value: devicemanual,
                valueType: {
                  dataObjectType: {
                    name: 'string'
                  }
                }
              },
              {
                kind: 'Instance',
                embeddedDataSpecifications: [],
                modelType: {
                  name: 'Property'
                },
                descriptions: [],
                idShort: 'productinstanceuri',
                value: productinstanceuri,
                valueType: {
                  dataObjectType: {
                    name: 'string'
                  }
                }
              },
              {
                kind: 'Instance',
                embeddedDataSpecifications: [],
                modelType: {
                  name: 'Property'
                },
                descriptions: [],
                idShort: 'productcode',
                value: productcode,
                valueType: {
                  dataObjectType: {
                    name: 'string'
                  }
                }
              },
              {
                kind: 'Instance',
                embeddedDataSpecifications: [],
                modelType: {
                  name: 'Property'
                },
                descriptions: [],
                idShort: 'devicerevision',
                value: devicerevision,
                valueType: {
                  dataObjectType: {
                    name: 'string'
                  }
                }
              },
              {
                kind: 'Instance',
                embeddedDataSpecifications: [],
                modelType: {
                  name: 'Property'
                },
                descriptions: [],
                idShort: 'revisioncounter',
                value: revisioncounter,
                valueType: {
                  dataObjectType: {
                    name: 'string'
                  }
                }
              },
              {
                kind: 'Instance',
                embeddedDataSpecifications: [],
                modelType: {
                  name: 'Property'
                },
                descriptions: [],
                idShort: 'softwarerevision',
                value: softwarerevision,
                valueType: {
                  dataObjectType: {
                    name: 'string'
                  }
                }
              }
            ]
          })
        ]
      };
      if (receiverID) {
        msg.payload.frame.receiver.identification = {
          id: receiverID,
          idType: 'IRI'
        };
      }
      node.send(msg);
    });
  }
  RED.nodes.registerType('i40-aas-onboarding', i40_aas_onboarding_node);
};
