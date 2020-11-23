sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/core/routing/History",
  "sap/m/MessageToast"
], function (Controller, JSONModel, History, MessageToast) {
  "use strict";

  return Controller.extend("i40-aas-registry-ui.i40-aas-registry-ui.controller.ShowAllSemanticProtocols", {

    onInit: function () {
      this.getView().addEventDelegate({
        onAfterShow: this.onAfterShow,
      }, this);
    },

    onAfterShow: function () {
      this.initiateModel();
      this.startAutorefreshModel(30000);
    },

    initiateModel: function () {
      var aSemanticProtocols = (function () {
        var aSemanticProtocols = null;
        jQuery.ajax({
          'async': false,
          'global': false,
          'url': "/resources/semanticProtocols",
          'dataType': "json",
          'success': function (data) {
            aSemanticProtocols = data;
          }
        });
        return aSemanticProtocols;
      })();

      var oData = {
        "SemanticProtocolsCollection": aSemanticProtocols
      };
      var oModel = new JSONModel(oData);
      this.getView().setModel(oModel, "SemanticProtocolList");
    },

    // --------------- Begin auto refresh -------------------------

    startAutorefreshModel: function (timeInMilliseconds) {
      var self = this;
      this.intervalHandle = setInterval(function () {
        self.initiateModel();
      }, timeInMilliseconds);

    },

    stopAutorefreshModel: function () {
      if (this.intervalHandle)
        clearInterval(this.intervalHandle);
    },
    // --------------- End auto refresh -------------------------

    // --------------- Begin route to SingleSemanticProtocol -------------------------

    onOpenSingleSemanticProtocol: function (oEvent) {
      var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
      var oItem = oEvent.getSource();

      var SPId = oItem.getBindingContext("SemanticProtocolList").getProperty("identification/id");
      var SPIdEncoded = encodeURIComponent(SPId);

      oRouter.navTo("SingleSemanticProtocol", {
        SPId: SPIdEncoded
      });
      this.stopAutorefreshModel();
    },

    // --------------- End route to SingleSemanticProtocol ---------------------------

    onNavBack: function () {
      var oHistory = History.getInstance();
      var sPreviousHash = oHistory.getPreviousHash();

      if (sPreviousHash !== undefined) {
        window.history.go(-1);
      } else {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("overview", {}, true);
      }
      this.stopAutorefreshModel();
    },

    onExit: function () {
      // detach delegates
      this.getView().removeEventDelegate(this._afterShowDelegate);
      this._afterShowDelegate = null;
      // stopAutorefresh
      this.stopAutorefreshModel();
    },

  });

});
