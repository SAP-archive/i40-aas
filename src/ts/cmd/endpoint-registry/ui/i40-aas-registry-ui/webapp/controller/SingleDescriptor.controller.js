sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast"
], function (Controller, History, JSONModel, MessageToast) {
	"use strict";

	return Controller.extend("i40-aas-registry-ui.i40-aas-registry-ui.controller.SingleDescriptor", {

		onUpdateFinished: function (oEvent) {
			var oList = oEvent.getSource();
			var aItems = oList.getItems();
			var oItem = aItems[0];
			if (oItem !== undefined) {
				var oCtx = oItem.getBindingContext('SingleDescriptor');
				var path = oCtx.getPath();
				var namedModelPath = "SingleDescriptor>" + path;
				this.getView().byId("EndpointDetail").bindElement(namedModelPath);
			}

		},

		onInit: function () {
			/* eslint-env es6 */
			/* eslint-disable no-console */
			const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("SingleDescriptor").attachMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function (oEvent) {
			const iAASId = oEvent.getParameter("arguments").AASId;
			// console.warn("iAASId = " + iAASId);

			// Use Object Lib for IdType Dropdown menu
			var oIdTypes = aas.IdTypeEnum
			var IdTypeKeys = Object.keys(oIdTypes);
	  
			var aIdTypes = new Array();
			for (var i = 0; i < IdTypeKeys.length; i++) {
			  var oObject = {};
			  oObject["TypeId"] = IdTypeKeys[i];
			  oObject["Name"] = IdTypeKeys[i];
					  aIdTypes.push(JSON.parse(JSON.stringify(oObject)));
				  }

			var aSingleAASDescriptor = (function () {
				var aSingleAASDescriptor = null;
				$.ajax({
					'async': false,
					'global': false,
					'url': "/AASDescriptors/" + iAASId,
					'dataType': "json",
					'success': function (data) {
						aSingleAASDescriptor = data;
					}
				});
				return aSingleAASDescriptor;
			})();

			var oData = {
				"IdTypeCollection": aIdTypes,

				"SingleAASDescriptor": aSingleAASDescriptor
			};
			var oModel = new JSONModel(oData);
			this.getView().setModel(oModel, "SingleDescriptor");
		},

		onEndpointObjectItemPress: function (oEvent) {
			var oItem = oEvent.getSource();
			var oCtx = oItem.getBindingContext('SingleDescriptor');
			var path = oCtx.getPath();
			var namedModelPath = "SingleDescriptor>" + path;
			this.getView().byId("EndpointDetail").bindElement(namedModelPath);
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