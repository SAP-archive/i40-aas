sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function (Controller, History, JSONModel, MessageToast, MsgBox) {
	"use strict";

	return Controller.extend("i40-aas-registry-ui.i40-aas-registry-ui.controller.CreateDescriptor", {

		onInit: function () {

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

			var oData = {
				"IdTypeCollection": aIdTypes,

				"EndpointTypeCollection": aEndpointTypes,

				"EndpointTargetCollection": aEndpointTargets,

				"CreateDescriptorFormular": aCreateDescriptorFormular

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

			this.getView().byId("EndpointDetail").setVisible(true);
			this.getView().byId("splitterSize").setSize("500px");
			this.getView().byId("splitterSize").setResizable(true);

		},

		onEndpointObjectItemPress: function (oEvent) {
			var oItem = oEvent.getSource();
			var oCtx = oItem.getBindingContext();
			var path = oCtx.getPath();
			this.getView().byId("EndpointDetail").bindElement(path);
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

		onSavePress: function () {
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
				//console.warn("data = " + data);
				//console.warn("status = " + status);
				//console.warn("response = " + response);
				if (status === "success") {
					MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("descriptorCreated"));
				} else {
					MessageToast.show(status + ": " + response);
				}

			});
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