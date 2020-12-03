sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast"
], function (Controller, History, JSONModel, MessageToast) {
	"use strict";

	return Controller.extend("i40-aas-registry-ui.i40-aas-registry-ui.controller.SingleSemanticProtocol", {

		onUpdateFinished: function (oEvent) {
			var oList = oEvent.getSource();
			var aItems = oList.getItems();
			var oItem = aItems[0];
			if (oItem !== undefined) {
				var oCtx = oItem.getBindingContext('SingleSemanticProtocol');
				var path = oCtx.getPath();
				var namedModelPath = "SingleSemanticProtocol>" + path;
				this.byId("roleDetail").bindElement(namedModelPath);
			}

		},
		onInit: function () {
			const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("SingleSemanticProtocol").attachMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function (oEvent) {
			const iSPId = oEvent.getParameter("arguments").SPId;

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

			// Set model for the SemanticProtocol with a specific SemanticProtocolId
			var oModelSingleSemanticProtocol = new JSONModel();
			this.getView().setModel(oModelSingleSemanticProtocol, "SingleSemanticProtocol");
			oModelSingleSemanticProtocol.loadData("/resources/semanticProtocols/" + iSPId);
		},

		onRoleObjectItemPress: function (oEvent) {
			var oItem = oEvent.getSource();
			var oCtx = oItem.getBindingContext('SingleSemanticProtocol');
			var path = oCtx.getPath();
			var namedModelPath = "SingleSemanticProtocol>" + path;
			this.byId("roleDetail").bindElement(namedModelPath);
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
