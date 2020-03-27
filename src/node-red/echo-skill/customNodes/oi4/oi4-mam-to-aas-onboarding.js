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
      var mam = msg.payload.Messages[0].Payload;
      var conversationID = msg.payload.MessageId || node.conversationID || new Date().getTime() + '-' + msg.payload.PublisherId;
      var senderID = msg.payload.PublisherId || node.senderID;
      var receiverID = node.receiverID;
      var submodelID = node.submodelID;
      var manufacturer = mam.Manufacturer.Text || node.manufacturer;
      var manufactureruri = mam.ManufacturerUri || node.manufactureruri;
      var model = mam.Model.Text || node.model;
      var serialnumber = mam.SerialNumber || node.serialnumber;
      var hardwarerevision = mam.HardwareRevision || node.hardwarerevision;
      var deviceclass = mam.DeviceClass || node.deviceclass;
      var devicemanual = mam.DeviceManual || node.devicemanual;
      var productinstanceuri = mam.ProductInstanceUri || node.productinstanceuri;
      var productcode = mam.ProductCode || node.productcode;
      var devicerevision = mam.DeviceRevision || node.devicerevision;
      var revisioncounter = mam.RevisionCounter || node.revisioncounter;
      var softwarerevision = mam.SoftwareRevision || node.softwarerevision;
      if (!senderID) {
        throw new Error('senderID is missing');
      }
      if (!productinstanceuri) {
        throw new Error('productinstanceuri is missing');
      }
      msg.payload = {
        conversationID: conversationID,
        senderID: senderID,
        receiverID: receiverID,
        submodelID: submodelID,
        manufacturer: manufacturer,
        manufactureruri: manufactureruri,
        model: model,
        serialnumber: serialnumber,
        hardwarerevision: hardwarerevision,
        deviceclass: deviceclass,
        devicemanual: devicemanual,
        productinstanceuri: productinstanceuri,
        productcode: productcode,
        devicerevision: devicerevision,
        revisioncounter: revisioncounter,
        softwarerevision: softwarerevision
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
  RED.nodes.registerType('oi4-mam-to-aas-onboarding', i40_aas_onboarding_node);
};
