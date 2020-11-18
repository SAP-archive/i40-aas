

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

    getInputs: function () {
      return {
        inputAasId: this.byId("InputAasId"),
        inputAssetId: this.byId("InputAssetId"),
        createButton: this.byId("CreateButton"),
        endpointAddress: this.byId("EndpointAddress"),
      }
    },

    initiateModel: function () {
      // Use Object Lib for IdType Dropdown menu
      var oIdTypeEnum = aas.IdTypeEnum
      var aIdTypeKeys = Object.keys(oIdTypeEnum);
      
      var aIdTypes = aIdTypeKeys.map(function(Key){
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
      var lastAddedEndpoint = model.getProperty("/CreateDescriptorFormular/descriptor/endpoints").length - 1;
      var newEndpointPath = "/CreateDescriptorFormular/descriptor/endpoints/" + lastAddedEndpoint;
      this.byId("EndpointDetail").bindElement(newEndpointPath);
      this.enableSplitscreen();

      // Check Endpoint Adress duplicate (New Endpoint):
      if (this.epAddressDuplicate()) {
        this.getInputs().endpointAddress.setValueState(sap.ui.core.ValueState.Error);
        this.getInputs().endpointAddress.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("addressDuplicate"));
      }
      this.checkCreateButton();
    },

    enableSplitscreen: function () {
      this.byId("EndpointDetail").setVisible(true);
      this.byId("splitterSize").setSize("500px");
      this.byId("splitterSize").setResizable(true);
    },

    disableSplitscreen: function () {
      this.byId("EndpointDetail").setVisible(false);
      this.byId("splitterSize").setSize("100%");
      this.byId("splitterSize").setResizable(false);
    },

    onEndpointObjectItemPress: function (oEvent) {
      var oItem = oEvent.getSource();
      var oCtx = oItem.getBindingContext();
      var path = oCtx.getPath();
      this.byId("EndpointDetail").bindElement(path);
    },

    aasIdDuplicate: function (aasId) {
      var AASDescriptors = this.getView().getModel().getProperty("/AASDescriptorsCollection")
      for (var i = 0; i < AASDescriptors.length; i++) {
        if (aasId === AASDescriptors[i].identification.id) {
          return true;
        }
      }
      return false;
    },

    assetIdDuplicate: function (assetId) {
      var AASDescriptors = this.getView().getModel().getProperty("/AASDescriptorsCollection")
      for (var i = 0; i < AASDescriptors.length; i++) {
        if (assetId === AASDescriptors[i].asset.id) {
          return true;
        }
      }
      return false;
    },

    // Check the Endpoint Addresses from any Endpoint for duplicate
    epAddressDuplicate: function () {
      var endpoints = this.getView().getModel().getProperty("/CreateDescriptorFormular/descriptor/endpoints")
      for (var i = 0; i < Math.round(endpoints.length / 2); i++) { //Just need to compare the first half of the objects with all other objects
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
      this.getInputs().createButton.setEnabled(true);
      // Check if Field is empty
      if (newValue === "") {
        inputControl.setValueState(sap.ui.core.ValueState.Error);
        inputControl.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("cantBeEmpty"));
      }
      // Only check for duplicate if Inputfield is identification/id
      if (inputControl === this.getInputs().inputAasId && this.aasIdDuplicate(newValue)) {
        inputControl.setValueState(sap.ui.core.ValueState.Error);
        inputControl.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("duplicate"));
      }
      // Only check for duplicate if Inputfield is asset/id
      if (inputControl === this.getInputs().inputAssetId && this.assetIdDuplicate(newValue)) {
        inputControl.setValueState(sap.ui.core.ValueState.Error);
        inputControl.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("duplicate"));
      }
      // Only check for duplicate if Inputfield is descriptor/endpoints/address
      if (inputControl === this.getInputs().endpointAddress && this.epAddressDuplicate()) {
        inputControl.setValueState(sap.ui.core.ValueState.Error);
        inputControl.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("addressDuplicate"));
      }

      this.checkCreateButton();



    },
    // Disable CreateButton if ValueState of AssetId, AssId or endpointAdress is Error & enable if not
    checkCreateButton: function () {
      if (this.getInputs().inputAasId.getValueState() == "Error" || this.getInputs().inputAssetId.getValueState() == "Error" || this.getInputs().endpointAddress.getValueState() == "Error") {
        this.getInputs().createButton.setEnabled(false);
      } else {
        this.getInputs().createButton.setEnabled(true);
      }
    },

    onCreateDescriptor: function () {
      if (this.getInputs().inputAasId.getValue() === "") {
        this.getInputs().inputAasId.setValueState(sap.ui.core.ValueState.Error);
        this.getInputs().inputAasId.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("cantBeEmpty"));
      } else if (this.getInputs().inputAssetId.getValue() === "") {
        this.getInputs().inputAssetId.setValueState(sap.ui.core.ValueState.Error);
        this.getInputs().inputAssetId.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("cantBeEmpty"));
      } else {
        var that = this;
        var lv_data = this.getView().getModel().getProperty("/CreateDescriptorFormular");
        var lv_dataString = JSON.stringify(lv_data);
        //console.warn("lv_dataString = " + lv_dataString);

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

    resetScreenToInitial: function () {
      this.initiateModel();
      this.disableSplitscreen();
      this.getInputs().inputAasId.setValueState(sap.ui.core.ValueState.None);
      this.getInputs().inputAssetId.setValueState(sap.ui.core.ValueState.None);
      this.getInputs().endpointAddress.setValueState(sap.ui.core.ValueState.None);
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
