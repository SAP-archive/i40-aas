sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/base/ManagedObject",
	"sap/ui/base/Event"
], function (Controller, History, JSONModel, MessageToast, ManagedObject, Event) {
	"use strict";

	return Controller.extend("i40-aas-registry-ui.i40-aas-registry-ui.controller.CreateSemanticProtocol", {

		onInit: function (oEvent) {

			this._oPnl = this.byId("idPnl");

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

			var aAASDescriptors = (function () {
				var aAASDescriptors = null;
				$.ajax({
					'async': false,
					'global': false,
					'url': "AASDescriptors",
					'dataType': "json",
					'success': function (data) {
						aAASDescriptors = data;
					}
				});
				return aAASDescriptors;
			})();

			var aCreateSPFormular = {
				"identification": {
					"id": "",
					"idType": "IRI"
				},
				"roles": []
			};

			var oData = {
				"IdTypeCollection": aIdTypes,

				"AASDescriptors": aAASDescriptors,

				"CreateSPFormular": aCreateSPFormular
			};

			var oModel = new JSONModel(oData);
			this.getView().setModel(oModel);

		},

		addInput: function () {
			var oSelect = new sap.m.Select({
				forceSelection: false,
				width: "250px"

			});
			var oItemTemplate = new sap.ui.core.Item({
				text: '{identification/id}', // here goes your binding for the property "Name" of your item
				key: '{key}' //not needed???
			});

			var oSorter = new sap.ui.model.Sorter('identification/id');

			oSelect.bindItems({
				path: "/AASDescriptors",
				template: oItemTemplate,
				sorter: oSorter,
				templateShareable: true

			});

			var delIcon = new sap.ui.core.Icon({
				src: "sap-icon://delete",
				press: this.onDeleteCcMail
			});
			var _oCcLayout = new sap.m.FlexBox({
				alignItems: "Center",
				justifyContent: "Start",
				items: [oSelect, delIcon]
			});
			this._oPnl.addContent(_oCcLayout);
		},

		onDeleteCcMail: function (oEvent) {
			var rowItemContainer = oEvent.getSource().getParent();
			rowItemContainer.destroy();
		},

		onAddRolePress: function () {
			var model = this.getView().getModel();
			var localdata = model.getProperty("/CreateSPFormular");

			var oMainObject = {};
			oMainObject["name"] = this.getView().byId("RoleName").getValue();
			var aMainObjectArray = new Array();
			var oObject = {};

			//-------count of the Selects-----
			//console.log(this.getView().byId("idPnl").getContent().length);

			//--------access first Select------
			//console.log(this.getView().byId("idPnl").getContent()[0].getItems()[0].getValue());

			//--------access second Select-------
			//console.log(this.getView().byId("idPnl").getContent()[1].getItems()[0].getValue());

			for (var i = 0; i < this.getView().byId("idPnl").getContent().length; i++) {
				//console.log(this.getView().byId("idPnl").getContent()[i].getItems()[0].getValue());
				oObject["id"] = this.getView().byId("idPnl").getContent()[i].getItems()[0].getSelectedItem().getText();
				aMainObjectArray.push(JSON.parse(JSON.stringify(oObject)));
			}

			oMainObject["aasDescriptorIds"] = aMainObjectArray;

			localdata.roles.push(oMainObject);
			model.setProperty("/CreateSPFormular", localdata);
			MessageToast.show(this.getView().getModel(
				"i18n").getResourceBundle().getText("roleCreated"));

			var lastAddedRole = model.getProperty("/CreateSPFormular/roles").length - 1;
			var newRolePath = "/CreateSPFormular/roles/" + lastAddedRole;
			this.getView().byId("roleDetail").bindElement(newRolePath);

			this.getView().byId("roleDetail").setVisible(true);
			this.getView().byId("splitterSize").setSize("500px");
			this.getView().byId("splitterSize").setResizable(true);
		},

		onRoleObjectItemPress: function (oEvent) {
			var oItem = oEvent.getSource();
			var oCtx = oItem.getBindingContext();
			var path = oCtx.getPath();
			this.getView().byId("roleDetail").bindElement(path);
		},

		onDeleteRoleObject: function (oEvent) {
			/*var oItem = oEvent.getSource();
			var oCtx = oItem.getParent().getBindingContext();
			var path = oCtx.getPath();*/

			var oItem = oEvent.getParameter('listItem');
			var oCtx = oItem.getBindingContext();
			var path = oCtx.getPath();
			var idx = path.charAt(path.lastIndexOf('/') + 1);

			if (idx !== -1) {
				var oModel = this.getView().getModel();
				var pathToRoles = oModel.getProperty("/CreateSPFormular/roles");
				pathToRoles.splice(idx, 1);

				oModel.setProperty("/CreateSPFormular/roles", pathToRoles);

				var oList = this.getView().byId("RoleList");
				oList.getBinding("items").refresh(true);

			}

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

		onSavePress: function () {
			var that = this;
			var lv_data = this.getView().getModel().getProperty("/CreateSPFormular");
			var lv_dataString = JSON.stringify(lv_data);
			//console.warn("lv_dataString = " + lv_dataString);

			$.ajax({
				url: 'semanticProtocols',
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
					MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("semanticProtocolCreated"));
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
		}

	});

});