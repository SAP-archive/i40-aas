sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/routing/History",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function (Controller, History, JSONModel, MessageToast) {
  "use strict";

  return Controller.extend("i40-aas-registry-ui.i40-aas-registry-ui.controller.SingleDescriptor", {

    onInit: function () {
      const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
      oRouter.getRoute("SingleDescriptor").attachMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (oEvent) {
      const iAASId = oEvent.getParameter("arguments").AASId;

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

      // Set model for the AASDescriptor with a specific AASId
      var oModelaSingleDescriptor = new JSONModel();
      this.getView().setModel(oModelaSingleDescriptor, "SingleDescriptor");
      oModelaSingleDescriptor.loadData("/endpoint-registry/AASDescriptors/" + iAASId);
    },

    // Shows initial the details of the first endpoint in the endpoint details part of the splitscreen
    onUpdateFinished: function (oEvent) {
      var oList = oEvent.getSource();
      var aItems = oList.getItems();
      var oItem = aItems[0];
      if (oItem !== undefined) {
        var oCtx = oItem.getBindingContext('SingleDescriptor');
        var path = oCtx.getPath();
        var namedModelPath = "SingleDescriptor>" + path;
        this.byId("EndpointDetail").bindElement(namedModelPath);
      }
    },

    // Shows the details of the selected endpoint in the endpoint details part of the splitscreen
    onEndpointObjectItemPress: function (oEvent) {
      var oItem = oEvent.getSource();
      var oCtx = oItem.getBindingContext('SingleDescriptor');
      var path = oCtx.getPath();
      var namedModelPath = "SingleDescriptor>" + path;
      this.byId("EndpointDetail").bindElement(namedModelPath);
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
    },

    onClosePress: function () {
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
