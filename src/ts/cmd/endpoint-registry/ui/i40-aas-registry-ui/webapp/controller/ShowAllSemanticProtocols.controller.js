sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast"
], function (Controller, JSONModel, History, MessageToast) {
	"use strict";

	return Controller.extend("i40-aas-registry-ui.i40-aas-registry-ui.controller.ShowAllSemanticProtocols", {

		onInit: function () {
			// set data model on view
			var aSemanticProtocols = (function () {
				var aSemanticProtocols = null;
				$.ajax({
					'async': false,
					'global': false,
					'url': "/semanticProtocols",
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

		// --------------- Begin SemanticProtocolList -------------------------

		onOpenSingleSemanticProtocol: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var oItem = oEvent.getSource();

			//eslint no-console: ["error", { allow: ["warn", "error"] }]
			//console.warn("oItem = " + oItem);
			//console.warn("SPId = " + oItem.getBindingContext("SemanticProtocolList").getProperty("identification/id"));
			var SPId = oItem.getBindingContext("SemanticProtocolList").getProperty("identification/id");
			var SPIdEncoded = encodeURIComponent(SPId);
			//var SPIdDecoded = decodeURIComponent(SPIdEncoded);
			//console.warn("SPId = " + SPId);
			//console.warn("SPIdEncoded = " + SPIdEncoded);
			//console.warn("SPIdDecoded = " + SPIdDecoded);

			oRouter.navTo("SingleSemanticProtocol", {
				SPId: SPIdEncoded
			});
		},

		// --------------- End SemanticProtocolList ---------------------------

		onNavBack: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("overview", {}, true);
			}
		}

	});

});