module.exports = function(RED) {
  function oi4_mam_generator_node(config) {
    RED.nodes.createNode(this, config);
    this.DataSetClassId = config.datasetclassID;
    this.PublisherId = config.publisherID;
    this.DataSetWriterId = config.datasetwriterID;
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
      var DataSetClassId = msg.payload.DataSetClassId || node.DataSetClassId;
      var PublisherId = msg.payload.PublisherId || node.PublisherId;
      var DataSetWriterId = msg.payload.DataSetWriterId || node.DataSetWriterId;
      var manufacturer = msg.payload.Manufacturer || node.manufacturer;
      var manufactureruri = msg.payload.ManufacturerUri || node.manufactureruri;
      var model = msg.payload.Model || node.model;
      var serialnumber = msg.payload.SerialNumber || node.serialnumber;
      var hardwarerevision = msg.payload.HardwareRevision || node.hardwarerevision;
      var deviceclass = msg.payload.DeviceClass || node.deviceclass;
      var devicemanual = msg.payload.DeviceManual || node.devicemanual;
      var productinstanceuri = msg.payload.ProductInstanceUri || node.productinstanceuri;
      var productcode = msg.payload.ProductCode || node.productcode;
      var devicerevision = msg.payload.DeviceRevision || node.devicerevision;
      var revisioncounter = msg.payload.RevisionCounter || node.revisioncounter;
      var softwarerevision = msg.payload.SoftwareRevision || node.softwarerevision;
      var description = msg.payload.Description || node.description;

      msg.payload = {
        MessageId: PublisherId + new Date().getTime(),
        MessageType: 'ua-data',
        PublisherId: PublisherId,
        DataSetClassId: DataSetClassId,
        CorrelationId: PublisherId + new Date().getTime(),
        Messages: [
          {
            DataSetWriterId: DataSetWriterId,
            Timestamp: new Date().getTime(),
            DataSetClassId: 'mam',
            Payload: {
              Manufacturer: { Locale: 'en-US', Text: manufacturer },
              ManufacturerUri: manufactureruri,
              Model: { Locale: 'en-US', Text: model },
              ProductCode: productcode,
              HardwareRevision: hardwarerevision,
              SoftwareRevision: softwarerevision,
              DeviceRevision: devicerevision,
              DeviceManual: devicemanual,
              DeviceClass: deviceclass,
              SerialNumber: serialnumber,
              ProductInstanceUri: productinstanceuri,
              RevisionCounter: revisioncounter,
              Description: { Locale: 'en-US', Text: description }
            }
          }
        ]
      };
      node.send(msg);
    });
  }
  RED.nodes.registerType('oi4-mam-generator', oi4_mam_generator_node);
};
