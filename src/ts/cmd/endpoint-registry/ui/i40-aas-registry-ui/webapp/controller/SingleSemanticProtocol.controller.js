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
				this.getView().byId("roleDetail").bindElement(namedModelPath);
			}

		},
		onInit: function () {
			/* eslint-env es6 */
			/* eslint-disable no-console */
			const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("SingleSemanticProtocol").attachMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function (oEvent) {
			const iSPId = oEvent.getParameter("arguments").SPId;
			// console.warn("iSPId = " + iSPId);

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

			var aSingleSemanticProtocol = (function () {
				var aSingleSemanticProtocol = null;
				$.ajax({
					'async': false,
					'global': false,
					'url': "/semanticProtocols/" + iSPId,
					'dataType': "json",
					'success': function (data) {
						aSingleSemanticProtocol = data;
					}
				});
				return aSingleSemanticProtocol;
			})();

			var oData = {
				"IdTypeCollection": aIdTypes,

				"SingleSemanticProtocolData": aSingleSemanticProtocol
			};
			var oModel = new JSONModel(oData);
			this.getView().setModel(oModel, "SingleSemanticProtocol");
		},

		onRoleObjectItemPress: function (oEvent) {
			var oItem = oEvent.getSource();
			var oCtx = oItem.getBindingContext('SingleSemanticProtocol');
			var path = oCtx.getPath();
			var namedModelPath = "SingleSemanticProtocol>" + path;
			this.getView().byId("roleDetail").bindElement(namedModelPath);
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