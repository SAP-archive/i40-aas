sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/routing/History",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox",


], function (Controller, History, JSONModel, MessageToast, MsgBox) {
  "use strict";

  return Controller.extend("i40-aas-registry-ui.i40-aas-registry-ui.controller.CreateDescriptor", {

    onInit: function () {

      this.initiateModel();
    },

    getById: function () {
      return {
        inputAasId: this.byId("InputAasId"),
        inputAssetId: this.byId("InputAssetId"),
        createButton: this.byId("CreateButton"),
        endpointAddress: this.byId("EndpointAddress"),
        endpointDetails: this.byId("EndpointDetail"),
      }
    },

    initiateModel: function () {
      // Set model for ID-Type dropdown menu by using Object Lib
      var oIdTypeEnum = aas.IdTypeEnum
      var aIdTypeKeys = Object.keys(oIdTypeEnum);

      var aIdTypes = aIdTypeKeys.map(function (Key) {
        var oObject = {};
        oObject["TypeId"] = Key;
        oObject["Name"] = Key;
        return oObject
      });

      var oModelIdTypes = new JSONModel(aIdTypes);
      this.getView().setModel(oModelIdTypes, "IdTypeCollection");

      //Set model for Endpoint Type dropdown menu
      var oModelEndpointTypes = new JSONModel();
      this.getView().setModel(oModelEndpointTypes, "EndpointTypeCollection");
      oModelEndpointTypes.loadData("model/EndpointTypes.json");

      //Set model for Endpoint Target dropdown menu
      var oModelEndpointTargets = new JSONModel();
      this.getView().setModel(oModelEndpointTargets, "EndpointTargetCollection");
      oModelEndpointTargets.loadData("model/EndpointTargets.json");

      //Set model for exisiting Descriptors
      var oModelAASDescriptors = new JSONModel();
      this.getView().setModel(oModelAASDescriptors, "AASDescriptorsCollection");
      oModelAASDescriptors.loadData("/endpoint-registry/AASDescriptors");

      //Set model for a new Descriptor
      var aCreateDescriptorFormular = {
        "asset": {
          "id": "",
          "idType": "IRI"
        },
        "descriptor": {
          "endpoints": [],
          "signature": ""
        },
        "identification": {
          "id": "",
          "idType": "IRI"
        }
      };

      var oModelCreateDescriptorFormular = new JSONModel(aCreateDescriptorFormular);
      this.getView().setModel(oModelCreateDescriptorFormular);

    },

    // Add an endpoint to the current descriptor
    onAddNewEndpointPress: function () {
      var model = this.getView().getModel();
      var localdata = model.getProperty("/");
      var addOneMoreEndpoint = {};
      addOneMoreEndpoint["address"] = "New Endpoint";
      addOneMoreEndpoint["type"] = "https";
      addOneMoreEndpoint["target"] = "cloud";
      addOneMoreEndpoint["user"] = "";
      addOneMoreEndpoint["password"] = "";
      addOneMoreEndpoint["tls_certificate"] = "";
      addOneMoreEndpoint["certificate_x509_i40"] = "";
      localdata.descriptor.endpoints.push(addOneMoreEndpoint);
      model.setProperty("/", localdata);
      MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("endpointCreated"));

      this.showDetailsOfLastAddedEndpoint();
      this.enableSplitscreen();

      // Check for endpoint address duplicate (in this case for address: New Endpoint)
      if (this.epAddressDuplicate()) {
        this.getById().endpointAddress.setValueState(sap.ui.core.ValueState.Error);
        this.getById().endpointAddress.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("addressDuplicate"));
      }
      this.checkCreateButton();
    },

    // Delete an (previously added) endpoint from the descriptor
    onDeleteEndpoint: function (oEvent) {
      var oItem = oEvent.getParameter('listItem');
      var oCtx = oItem.getBindingContext();
      var path = oCtx.getPath();
      var idx = path.charAt(path.lastIndexOf('/') + 1);

      var oModel = this.getView().getModel();
      var aEndpoints = oModel.getProperty("/descriptor/endpoints");
      if (idx !== -1) {

        aEndpoints.splice(idx, 1);

        oModel.setProperty("/descriptor/endpoints", aEndpoints);

        var oList = this.byId("EndpointList");
        oList.getBinding("items").refresh(true);
        MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("endpointDeleted"));
      }
      this.showDetailsOfEndpointWithIndex(idx);
    },

    // Shows the details the last added endpoint in the endpoint details part of the splitscreen
    showDetailsOfLastAddedEndpoint: function () {
      var oModel = this.getView().getModel();
      var lastAddedEndpoint = oModel.getProperty("/descriptor/endpoints").length - 1;
      var newEndpointPath = "/descriptor/endpoints/" + lastAddedEndpoint;
      this.getById().endpointDetails.bindElement(newEndpointPath);
    },

    // Shows the details of an endpoint with a given index in the endpoint details part of the splitscreen
    showDetailsOfEndpointWithIndex: function (index) {
      var oModel = this.getView().getModel();
      var endpointCount = oModel.getProperty("/descriptor/endpoints").length;
      if (index <= 0) {
        this.getById().endpointDetails.bindElement("/descriptor/endpoints/" + "0");
        if (endpointCount === 0) {
          this.disableSplitscreen();
        }
      } else if (index > endpointCount - 1) {
        this.showDetailsOfLastAddedEndpoint();
      } else {
        this.getById().endpointDetails.bindElement("/descriptor/endpoints/" + index);
      }
    },


    enableSplitscreen: function () {
      this.getById().endpointDetails.setVisible(true);
      this.byId("splitterSize").setSize("500px");
      this.byId("splitterSize").setResizable(true);
    },

    disableSplitscreen: function () {
      this.getById().endpointDetails.setVisible(false);
      this.byId("splitterSize").setSize("100%");
      this.byId("splitterSize").setResizable(false);
    },

    // Shows the details of the selected endpoint in the endpoint details part of the splitscreen
    onEndpointObjectItemPress: function (oEvent) {
      var oItem = oEvent.getSource();
      var oCtx = oItem.getBindingContext();
      var path = oCtx.getPath();
      this.getById().endpointDetails.bindElement(path);
    },

    // Compares the given aasId with all existing aasIds. Returns true if the same id exists already
    aasIdDuplicate: function (aasId) {
      var AASDescriptors = this.getView().getModel("AASDescriptorsCollection").getProperty("/")
      for (var i = 0; i < AASDescriptors.length; i++) {
        if (aasId === AASDescriptors[i].identification.id) {
          return true;
        }
      }
      return false;
    },

    // Compares the given assetId with all existing assetIds. Returns true if the same id exists already
    assetIdDuplicate: function (assetId) {
      var AASDescriptors = this.getView().getModel("AASDescriptorsCollection").getProperty("/")
      for (var i = 0; i < AASDescriptors.length; i++) {
        if (assetId === AASDescriptors[i].asset.id) {
          return true;
        }
      }
      return false;
    },

    // Check the Endpoint Addresses from any Endpoint of this Descriptor for duplicate. Returns true if a duplicate is found
    epAddressDuplicate: function () {
      var endpoints = this.getView().getModel().getProperty("/descriptor/endpoints")
      for (var i = 0; i < endpoints.length; i++) {
        var count = 0;
        for (var j = 0; j < endpoints.length; j++) {
          if (endpoints[i].address === endpoints[j].address) {
            count++;
            // count = 1 is its self -> count > 1 means there is a duplicate
            if (count > 1) {
              return true;
            }
          }
        }
      }
      return false;
    },


    //Shows a red border around the input field as long as it is empty or duplicate entry is found
    onLiveChange(oEvent) {
      var id = oEvent.getParameter("id");
      var newValue = oEvent.getParameter("newValue");
      var inputControl = this.byId(id);

      inputControl.setValueState(sap.ui.core.ValueState.None);
      this.getById().createButton.setEnabled(true);
      // Check if Field is empty
      if (newValue === "") {
        inputControl.setValueState(sap.ui.core.ValueState.Error);
        inputControl.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("cantBeEmpty"));
      }
      // Only check for duplicate if Inputfield is identification/id
      if (inputControl === this.getById().inputAasId && this.aasIdDuplicate(newValue)) {
        inputControl.setValueState(sap.ui.core.ValueState.Error);
        inputControl.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("duplicate"));
      }
      // Only check for duplicate if Inputfield is asset/id
      if (inputControl === this.getById().inputAssetId && this.assetIdDuplicate(newValue)) {
        inputControl.setValueState(sap.ui.core.ValueState.Error);
        inputControl.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("duplicate"));
      }
      // Only check for duplicate if Inputfield is descriptor/endpoints/address
      if (inputControl === this.getById().endpointAddress && this.epAddressDuplicate()) {
        inputControl.setValueState(sap.ui.core.ValueState.Error);
        inputControl.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("addressDuplicate"));
      }

      this.checkCreateButton();



    },
    // Disable CreateButton if ValueState of AssetId, AssId or endpointAdress is Error & enable if not
    checkCreateButton: function () {
      if (this.getById().inputAasId.getValueState() == "Error" || this.getById().inputAssetId.getValueState() == "Error" || this.getById().endpointAddress.getValueState() == "Error") {
        this.getById().createButton.setEnabled(false);
      } else {
        this.getById().createButton.setEnabled(true);
      }
    },

    // Sending the data to the DB
    onCreateDescriptor: function () {
      if (this.getById().inputAasId.getValue() === "") {
        this.getById().inputAasId.setValueState(sap.ui.core.ValueState.Error);
        this.getById().inputAasId.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("cantBeEmpty"));
      } else if (this.getById().inputAssetId.getValue() === "") {
        this.getById().inputAssetId.setValueState(sap.ui.core.ValueState.Error);
        this.getById().inputAssetId.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("cantBeEmpty"));
      } else {
        var that = this;
        var lv_data = this.getView().getModel().getProperty("/");

        fetch("/endpoint-registry/AASDescriptors", {
          method: "PUT",
          body: JSON.stringify(lv_data),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }).then((response) => {
          if (response.ok) {
            MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("descriptorCreated"));
            that.resetScreenToInitial();
          } else {
            MessageToast.show(response.statusText);
          }
        }).catch(err => {
          console.error(err)
        })
      }
    },

    // Rest all fields and Models to initial
    resetScreenToInitial: function () {
      this.initiateModel();
      this.disableSplitscreen();
      this.getById().inputAasId.setValueState(sap.ui.core.ValueState.None);
      this.getById().inputAssetId.setValueState(sap.ui.core.ValueState.None);
      this.getById().endpointAddress.setValueState(sap.ui.core.ValueState.None);
      this.checkCreateButton();
    },

    onCancelPress: function () {
      var oHistory = History.getInstance();
      var sPreviousHash = oHistory.getPreviousHash();

      if (sPreviousHash !== undefined) {
        window.history.go(-1);
      } else {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("overview", true);
      }
      this.resetScreenToInitial();
      MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("canceled"));
    },

    onNavBack: function () {
      var oHistory = History.getInstance();
      var sPreviousHash = oHistory.getPreviousHash();

      if (sPreviousHash !== undefined) {
        window.history.go(-1);
      } else {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("overview", true);
      }
    }
  });
});
