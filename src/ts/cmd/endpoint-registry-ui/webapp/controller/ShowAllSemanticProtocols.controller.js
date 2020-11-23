sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/core/routing/History",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, JSONModel, History, MessageToast, MessageBox) {
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
    //Get the SemanticProtocols from the Server
    initiateModel: function () {
      var oModel = new JSONModel();
      this.getView().setModel(oModel, "SemanticProtocolList");
      oModel.loadData("/resources/semanticProtocols");
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


    // Delete selected SemanticProtocol
    onDeleteSP: function (oEvent) {
      var SPId = oEvent.getParameters().listItem.getBindingContext("SemanticProtocolList").getProperty("identification/id");

      MessageBox.confirm("Do you really want to delete the SemanticProtocol: \"" + SPId + "\" ?", {
        title: "Delete SemanticProtocol: \"" + SPId + "\"",
        icon: MessageBox.Icon.WARNING,
        actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
        emphasizedAction: MessageBox.Action.DELETE,
        onClose: function (sAction) {
          if (sAction == "DELETE") {

            var that = this;
            return fetch("/resources/semanticProtocols/" + SPId, {
              method: "DELETE"
            }).then((response) => {
              if (response.ok) {
                MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("semanticProtocolDeleted"));
                that.initiateModel();
              } else {
                MessageToast.show(response.statusText);
              }
            }).catch(err => {
              console.error(err)
            })
          } else {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("canceled"));
          }
        }.bind(this)
      });
    },

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
