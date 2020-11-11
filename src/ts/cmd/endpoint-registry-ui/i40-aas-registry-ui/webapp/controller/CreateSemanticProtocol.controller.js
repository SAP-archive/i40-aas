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

			this.initiateModel();
		},

		initiateModel: function (oEvent) {
			this._oPnl = this.byId("idPnl");

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

			var aAASDescriptors = (function () {
				var aAASDescriptors = null;
				$.ajax({
					'async': false,
					'global': false,
					'url': "/AASDescriptors",
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

		onAddDescriptorDropdown: function () {
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

		onAddRole: function () {
			var oModel = this.getView().getModel();
			var localdata = oModel.getProperty("/CreateSPFormular");

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
			oModel.setProperty("/CreateSPFormular", localdata);
			this.resetDescriptorDropdown();
			MessageToast.show(this.getView().getModel(
				"i18n").getResourceBundle().getText("roleCreated"));
			this.getView().byId("RoleName").setValue("");

			this.showDetailsOfLastAddedRole();
			this.enableSplitscreen();
		},

		showDetailsOfLastAddedRole: function () {
			var oModel = this.getView().getModel();
			var lastAddedRole = oModel.getProperty("/CreateSPFormular/roles").length - 1;
			var newRolePath = "/CreateSPFormular/roles/" + lastAddedRole;
			this.getView().byId("roleDetail").bindElement(newRolePath);
		},

		showDetailsOfRoleWithIndex: function (index) {
			var oModel = this.getView().getModel();
			var roleCount = oModel.getProperty("/CreateSPFormular/roles").length;
			if (index <= 0) {
				this.getView().byId("roleDetail").bindElement("/CreateSPFormular/roles/" + "0");
				if (roleCount === 0) {
					this.disableSplitscreen();
				}
			} else if (index > roleCount - 1) {
				this.showDetailsOfLastAddedRole();
			} else {
				this.getView().byId("roleDetail").bindElement("/CreateSPFormular/roles/" + index);
			}
		},

		enableSplitscreen: function () {
			this.getView().byId("roleDetail").setVisible(true);
			this.getView().byId("splitterSize").setSize("500px");
			this.getView().byId("splitterSize").setResizable(true);
		},

		disableSplitscreen: function () {
			this.getView().byId("roleDetail").setVisible(false);
			this.getView().byId("splitterSize").setSize("100%");
			this.getView().byId("splitterSize").setResizable(false);
		},

		onRoleObjectItem: function (oEvent) {
			var oItem = oEvent.getSource();
			var oCtx = oItem.getBindingContext();
			var path = oCtx.getPath();
			this.getView().byId("roleDetail").bindElement(path);
		},

		onDeleteRoleObject: function (oEvent) {
			var oItem = oEvent.getParameter('listItem');
			var oCtx = oItem.getBindingContext();
			var path = oCtx.getPath();
			var idx = path.charAt(path.lastIndexOf('/') + 1);

			var oModel = this.getView().getModel();
			var pathToRoles = oModel.getProperty("/CreateSPFormular/roles");
			if (idx !== -1) {

				pathToRoles.splice(idx, 1);

				oModel.setProperty("/CreateSPFormular/roles", pathToRoles);

				var oList = this.getView().byId("RoleList");
				oList.getBinding("items").refresh(true);
			}
			this.showDetailsOfRoleWithIndex(idx);
		},

		onNavBack: function () {
			//this.resetScreenToInitial(); clear Screen not onNavBack??

			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("overview", true);
			}

		},

		onCreateSemanticProtocol: function () {
			var that = this;
			var lv_data = this.getView().getModel().getProperty("/CreateSPFormular");
			var lv_dataString = JSON.stringify(lv_data);
			//console.warn("lv_dataString = " + lv_dataString);

			$.ajax({
				url: '/semanticProtocols',
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
					that.resetScreenToInitial();
				} else {
					MessageToast.show(status + ": " + response);
				}

			});

		},

		resetDescriptorDropdown: function () {
			var oView = this.getView();
			var oPanel = oView.byId("idPnl");
			var oCtx = oPanel.getContent();

			for (var i = 0; i < oCtx.length; i++) {
				oCtx[i].destroy(true);
			}
			this.onAddDescriptorDropdown();
		},

		resetScreenToInitial: function () {
			this.getView().byId("RoleName").setValue("");
			this.resetDescriptorDropdown();
			this.initiateModel();
			this.disableSplitscreen();
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
			this.resetScreenToInitial();
			MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("canceled"));
		}

	});

});