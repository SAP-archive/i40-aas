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
      // Use Object Lib for IdType Dropdown menu
      var oIdTypeEnum = aas.IdTypeEnum
      var aIdTypeKeys = Object.keys(oIdTypeEnum);

      var aIdTypes = aIdTypeKeys.map(function (Key) {
        var oObject = {};
        oObject["TypeId"] = Key;
        oObject["Name"] = Key;
        return oObject
      });

      var aEndpointTypes = (function () {
        var aEndpointTypes = null;
        jQuery.ajax({
          'async': false,
          'global': false,
          'url': "model/EndpointTypes.json",
          'dataType': "json",
          'success': function (data) {
            aEndpointTypes = data;
          }
        });
        return aEndpointTypes;
      })();

      var aEndpointTargets = (function () {
        var aEndpointTargets = null;
        jQuery.ajax({
          'async': false,
          'global': false,
          'url': "model/EndpointTargets.json",
          'dataType': "json",
          'success': function (data) {
            aEndpointTargets = data;
          }
        });
        return aEndpointTargets;
      })();

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

      var aAASDescriptors = (function () {
        var aAASDescriptors = null;
        jQuery.ajax({
          'async': false,
          'global': false,
          'url': "/resources/AASDescriptors",
          'dataType': "json",
          'success': function (data) {
            aAASDescriptors = data;
          }
        });
        return aAASDescriptors;
      })();

      var oData = {
        "IdTypeCollection": aIdTypes,

        "EndpointTypeCollection": aEndpointTypes,

        "EndpointTargetCollection": aEndpointTargets,

        "CreateDescriptorFormular": aCreateDescriptorFormular,

        "AASDescriptorsCollection": aAASDescriptors

      };
      // set explored app's demo model on this sample
      var oModel = new JSONModel(oData);
      this.getView().setModel(oModel);

    },

    // Add an endpoint to the current descriptor
    onAddNewEndpointPress: function () {
      var model = this.getView().getModel();
      var localdata = model.getProperty("/CreateDescriptorFormular");
      var addOneMoreEndpoint = {};
      addOneMoreEndpoint["address"] = "New Endpoint";
      addOneMoreEndpoint["type"] = "https";
      addOneMoreEndpoint["target"] = "cloud";
      addOneMoreEndpoint["user"] = "";
      addOneMoreEndpoint["password"] = "";
      addOneMoreEndpoint["tls_certificate"] = "";
      addOneMoreEndpoint["certificate_x509_i40"] = "";
      localdata.descriptor.endpoints.push(addOneMoreEndpoint);
      model.setProperty("/CreateDescriptorFormular", localdata);
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
      debugger;
      var oItem = oEvent.getParameter('listItem');
      var oCtx = oItem.getBindingContext();
      var path = oCtx.getPath();
      var idx = path.charAt(path.lastIndexOf('/') + 1);

      var oModel = this.getView().getModel();
      var aEndpoints = oModel.getProperty("/CreateDescriptorFormular/descriptor/endpoints");
      if (idx !== -1) {

        aEndpoints.splice(idx, 1);

        oModel.setProperty("/CreateDescriptorFormular/descriptor/endpoints", aEndpoints);

        var oList = this.byId("EndpointList");
        oList.getBinding("items").refresh(true);
        MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("endpointDeleted"));
      }
      this.showDetailsOfEndpointWithIndex(idx);
    },

    // Shows the details the last added endpoint in the endpoint details part of the splitscreen
    showDetailsOfLastAddedEndpoint: function () {
      var oModel = this.getView().getModel();
      var lastAddedEndpoint = oModel.getProperty("/CreateDescriptorFormular/descriptor/endpoints").length - 1;
      var newEndpointPath = "/CreateDescriptorFormular/descriptor/endpoints/" + lastAddedEndpoint;
      this.getById().endpointDetails.bindElement(newEndpointPath);
    },

    // Shows the details of an endpoint with a given index in the endpoint details part of the splitscreen
    showDetailsOfEndpointWithIndex: function (index) {
      var oModel = this.getView().getModel();
      var endpointCount = oModel.getProperty("/CreateDescriptorFormular/descriptor/endpoints").length;
      if (index <= 0) {
        this.getById().endpointDetails.bindElement("/CreateDescriptorFormular/descriptor/endpoints/" + "0");
        if (endpointCount === 0) {
          this.disableSplitscreen();
        }
      } else if (index > endpointCount - 1) {
        this.showDetailsOfLastAddedEndpoint();
      } else {
        this.getById().endpointDetails.bindElement("/CreateDescriptorFormular/descriptor/endpoints/" + index);
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
      var AASDescriptors = this.getView().getModel().getProperty("/AASDescriptorsCollection")
      for (var i = 0; i < AASDescriptors.length; i++) {
        if (aasId === AASDescriptors[i].identification.id) {
          return true;
        }
      }
      return false;
    },

    // Compares the given assetId with all existing assetIds. Returns true if the same id exists already
    assetIdDuplicate: function (assetId) {
      var AASDescriptors = this.getView().getModel().getProperty("/AASDescriptorsCollection")
      for (var i = 0; i < AASDescriptors.length; i++) {
        if (assetId === AASDescriptors[i].asset.id) {
          return true;
        }
      }
      return false;
    },

    // Check the Endpoint Addresses from any Endpoint of this Descriptor for duplicate. Returns true if a duplicate is found
    epAddressDuplicate: function () {
      var endpoints = this.getView().getModel().getProperty("/CreateDescriptorFormular/descriptor/endpoints")
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
      debugger;
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
        var lv_data = this.getView().getModel().getProperty("/CreateDescriptorFormular");
        var lv_dataString = JSON.stringify(lv_data);

        $.ajax({
          url: '/resources/AASDescriptors',
          type: 'PUT',
          contentType: "application/json",
          dataType: "json",
          data: lv_dataString
        }).always(function (data, status, response) {
          if (status === "success") {
            MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("descriptorCreated"));
            that.resetScreenToInitial();
          } else {
            MessageToast.show(status + ": " + response);
          }
        });
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
