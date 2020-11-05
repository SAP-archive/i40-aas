sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/core/routing/History",
	"sap/base/Log"
], function (Controller, JSONModel, MessageToast, History, Log) {
	"use strict";
	return Controller.extend("i40-aas-registry-ui.i40-aas-registry-ui.controller.View1", {
		onInit: function () {

			// var url = "AASDescriptors";
			// jQuery
			// 	.ajax({
			// 		url: url,
			// 		type: "GET",
			// 		dataType: "json",
			// 		success: function (result) {
			// 			Log.debug("*****************Inside success " + result);
			// 		},
			// 		error: function (e) {
			// 			// log error in browser
			// 			Log.debug(e.message);
			// 		}
			// 	});
		},
		onShowAllDescriptorsPress: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			oRouter.navTo("ShowAllDescriptors");
		},

		onCreateDescriptorPress: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			oRouter.navTo("CreateDescriptor");
		},

		onShowAllSemanticProtocolsPress: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			oRouter.navTo("ShowAllSemanticProtocols");
		},

		onCreateSemanticProtocolPress: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			oRouter.navTo("CreateSemanticProtocol");
		}
	});

});