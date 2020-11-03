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

    initiateModel: function () {

      var aIdTypes = (function () {
        var aIdTypes = null;
        $.ajax({
          'async': false,
          'global': false,
          'url': "mockserver/mockdata/Dropdowns/IdTypes.json",
          'dataType': "json",
          'success': function (data) {
            aIdTypes = data;
          }
        });
        return aIdTypes;
      })();

      var a = aas.IdTypeEnum  //keyType

      console.log(a);


      // var aIdTypes = (function () {
      //   var aIdTypes = null;
      //   $.ajax({
      //     url: '@Url.Action("Generate", "idTypes")',
      //     data: {
      //       'idTypes': IdTypeEnum
      //     },
      //     'success': function (data) {
      //       aIdTypes = data;
      //     }
      //   });
      //   return aIdTypes;
      // })();

      // var aIdTypes = (function () {
      //   var aIdTypes = null;
      //   $.ajax({
      //     url: "/i40-aas-objects/src/types/idTypeEnum.ts",
      //     data: {
      //       'idTypes': IdTypeEnum
      //     },
      //     'success': function (data) {
      //       aIdTypes = data;
      //     }
      //   });
      //   return aIdTypes;
      // })();



      var aEndpointTypes = (function () {
        var aEndpointTypes = null;
        $.ajax({
          'async': false,
          'global': false,
          'url': "mockserver/mockdata/Dropdowns/EndpointTypes.json",
          'dataType': "json",
          'success': function (data) {
            aEndpointTypes = data;
          }
        });
        return aEndpointTypes;
      })();

      var aEndpointTargets = (function () {
        var aEndpointTargets = null;
        $.ajax({
          'async': false,
          'global': false,
          'url': "mockserver/mockdata/Dropdowns/EndpointTargets.json",
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
				$.ajax({
					'async': false,
					'global': false,
					'url': "/AASDescriptors",
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
      //var jsonString = JSON.stringify(localdata);
      var addOneMoreEndpoint = {};
      addOneMoreEndpoint["address"] = "New Endpoint";
      addOneMoreEndpoint["type"] = "grpc";
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
      this.getView().byId("EndpointDetail").bindElement(newEndpointPath);

      this.enableSplitscreen();
    },

    enableSplitscreen: function () {
      this.getView().byId("EndpointDetail").setVisible(true);
      this.getView().byId("splitterSize").setSize("500px");
      this.getView().byId("splitterSize").setResizable(true);
    },

    disableSplitscreen: function () {
      this.getView().byId("EndpointDetail").setVisible(false);
      this.getView().byId("splitterSize").setSize("100%");
      this.getView().byId("splitterSize").setResizable(false);
    },

    onEndpointObjectItemPress: function (oEvent) {
      var oItem = oEvent.getSource();
      var oCtx = oItem.getBindingContext();
      var path = oCtx.getPath();
      this.getView().byId("EndpointDetail").bindElement(path);
    },

    //Looking for duplicate in DB (new request echt time):
    //Causes 404 error in Console, but works
    // aasIdDuplicate: function (aasId) {
    //   var AasIdEncoded = encodeURIComponent(aasId);
    //   var aAASDescriptor = (function () {
    //     var aAASDescriptor = null;
    //     $.ajax({
    //       'async': false,
    //       'global': false,
    //       'url': "/AASDescriptors/" + AasIdEncoded,
    //       'dataType': "json",
    //       'success': function (data) {
    //         aAASDescriptor = data;
    //       }
    //     });
    //     return aAASDescriptor;
    //   })();

    //   var oModel = new JSONModel(aAASDescriptor);
    //   this.getView().setModel(oModel, "Descriptor");
    //   var id = this.getView().getModel("Descriptor").getProperty("/identification/id");

    //   if (id === aasId) {
    //     return true;
    //   } else {
    //     return false;
    //   }
    // },

    // Looking for dublicate in local data from DB (one request):
    aasIdDuplicate: function (aasId) {
      var AASDescriptors = this.getView().getModel().getProperty("/AASDescriptorsCollection")
      for (var i = 0; i < AASDescriptors.length; i++){
          if (aasId === AASDescriptors[i].identification.id){
            return true;
          }
      }
      return false;
    },

    assetIdDuplicate: function (assetId) {
      var AASDescriptors = this.getView().getModel().getProperty("/AASDescriptorsCollection")
      for (var i = 0; i < AASDescriptors.length; i++){
          if (assetId === AASDescriptors[i].asset.id){
            return true;
          }
      }
      return false;
    },
    // InProgress: Better implement a loop to check the Endpoint Addresses from any Endpoint at any time!
    epAddressDuplicate: function (endpointAddress) {
      debugger;
      var count = 0;
      var endpoints = this.getView().getModel().getProperty("/CreateDescriptorFormular/descriptor/endpoints")
      for (var i = 0; i < endpoints.length; i++){
          if (endpointAddress === endpoints[i].address){
            count ++;
            // count = 1 is its self -> count > 1 means there is a duplicate
            if (count > 1){
              return true;
            }
          }
      }
      return false;
    },


    //Shows a red border around the input field as long as it is empty
    onLiveChange(oEvent) {
      var id = oEvent.getParameter("id");
      var newValue = oEvent.getParameter("newValue");
      var inputControl = this.getView().byId(id);
      var inputAasId = this.getView().byId("InputAasId");
      var inputAssetId = this.getView().byId("InputAssetId");
      var createButton = this.getView().byId("Create");
      var endpointAddress = this.getView().byId("EndpointAddress");

      inputControl.setValueState(sap.ui.core.ValueState.None);
      createButton.setEnabled(true);
      // Check if Field is empty
      if (newValue === "") {
        inputControl.setValueState(sap.ui.core.ValueState.Error);
        inputControl.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("cantBeEmpty"));
      }
      // Only check for duplicate if Inputfield is identification/id
      if (inputControl === inputAasId && this.aasIdDuplicate(newValue)) {
        inputControl.setValueState(sap.ui.core.ValueState.Error);
        inputControl.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("duplicate"));
      }
      // Only check for duplicate if Inputfield is asset/id
      if (inputControl === inputAssetId && this.assetIdDuplicate(newValue)) {
        inputControl.setValueState(sap.ui.core.ValueState.Error);
        inputControl.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("duplicate"));
      }
      // Only check for duplicate if Inputfield is descriptor/endpoints/address
      if (inputControl === endpointAddress && this.epAddressDuplicate(newValue)) {
        inputControl.setValueState(sap.ui.core.ValueState.Error);
        inputControl.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("duplicate"));
      }



      // Disable CreateButton if ValueState of AssetId or AssId is Error
      var aasIdValueState = inputAasId.getValueState();
      var assetIdValueState = inputAssetId.getValueState();
      if (aasIdValueState == "Error" || assetIdValueState == "Error"){
        createButton.setEnabled(false);
      } else {
        createButton.setEnabled(true);
      }



    },


    //>>>>>>>>>>>>>>>>>>>>>>>>>>> Only needed for POST-Request >>>>>>>>>>>>>>>>>>>>>>>
    /*
    myToken: "",
    fetchToken: function () {
    	var that = this;
    	$.ajax({
    		url: '/AASDescriptors',
    		type: 'GET',
    		headers: {
    			"x-CSRF-Token": "Fetch"
    		}
    	}).always(function (data, status, response) {
    		that.myToken = response.getResponseHeader("x-csrf-token");
    		MessageToast.show("Token received: " + that.myToken);
    	});
    },
    */
    //<<<<<<<<<<<<<<<<<<<<<<<<<<<< Only needed for POST-Resquest <<<<<<<<<<<<<<<<<<<<<<

    onCreateDescriptor: function () {
      var inputAasId = this.getView().byId("InputAasId");
      var inputAssetId = this.getView().byId("InputAssetId");
      if (inputAasId.getValue() === "") {
        inputAasId.setValueState(sap.ui.core.ValueState.Error);
        inputAasId.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("cantBeEmpty"));
      } else if (inputAssetId.getValue() === "") {
        inputAssetId.setValueState(sap.ui.core.ValueState.Error);
        inputAssetId.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("cantBeEmpty"));
      } else {
        var that = this;
        var lv_data = this.getView().getModel().getProperty("/CreateDescriptorFormular");
        var lv_dataString = JSON.stringify(lv_data);
        //console.warn("lv_dataString = " + lv_dataString);

        $.ajax({
          url: '/AASDescriptors',
          type: 'PUT',
          //>>>>>>>>>>>>>>>>>>>>>>>>>>> Only needed for POST-Request >>>>>>>>>>>>>>>>>>>>>>>
          /*
          headers: {
            "x-CSRF-Token": this.myToken
          },
          */
          //<<<<<<<<<<<<<<<<<<<<<<<<<<<< Only needed for POST-Resquest <<<<<<<<<<<<<<<<<<<<<<
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
      var inputAasId = this.getView().byId("InputAasId");
      var inputAssetId = this.getView().byId("InputAssetId");
      inputAasId.setValueState(sap.ui.core.ValueState.None);
      inputAssetId.setValueState(sap.ui.core.ValueState.None);
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
