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

    getById: function () {
      return {
        inputRoleName: this.byId("InputRoleName"),
        addRoleButton: this.byId("AddRoleButton"),
        addDescriptorButton: this.byId("AddDescriptorButton"),
        roleDetail: this.byId("roleDetail"),
        descriptorIdInput: this.byId("DescriptorIdInput"),
        SPId: this.getView().getModel("SingleSemanticProtocol").getProperty("/identification/id"),
        SPIdType: this.getView().getModel("SingleSemanticProtocol").getProperty("/identification/idType")
      }
    },

    _onRouteMatched: function (oEvent) {
      const SPIdEncoded = oEvent.getParameter("arguments").SPId;

      this.setSingleSemanticProtocol(SPIdEncoded);
      this.setAASDescriptorsCollection();


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

      this.getById().roleDetail.bindElement("SingleSemanticProtocol>/roles/0");

    },

    //Create and Set model for exisiting Descriptors
    setAASDescriptorsCollection: function () {
      var oModelAASDescriptors = new JSONModel();
      this.getView().setModel(oModelAASDescriptors, "AASDescriptorsCollection");
      oModelAASDescriptors.loadData("/endpoint-registry/AASDescriptors");
    },

    // Create and Set model for the SemanticProtocol with a specific SemanticProtocolId
    setSingleSemanticProtocol: function (SPIdEncoded) {
      var oModelSingleSemanticProtocol = new JSONModel();
      this.getView().setModel(oModelSingleSemanticProtocol, "SingleSemanticProtocol");
      oModelSingleSemanticProtocol.loadData("/endpoint-registry/semanticProtocols/" + SPIdEncoded);
    },


    // Add a new Role to the SemanticProtocol
    onAddRole: function () {
      var SPId = this.getView().getModel("SingleSemanticProtocol").getProperty("/identification/id");
      var SPIdEncoded = encodeURIComponent(SPId);
      var localSemanticProtocol = this.getView().getModel("SingleSemanticProtocol").getProperty("/");
      var oMainObject = {};

      if (this.getById().inputRoleName.getValue() !== "") {
        oMainObject["name"] = this.getById().inputRoleName.getValue();
        localSemanticProtocol.roles.push(oMainObject);

        fetch("/endpoint-registry/admin/semanticProtocols", {
          method: "PUT",
          body: JSON.stringify(localSemanticProtocol),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }).then((response) => {
          if (response.ok) {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("roleCreated"));
            this.getById().inputRoleName.setValue("");

            this.showDetailsOfLastAddedRole();
            this.setSingleSemanticProtocol(SPIdEncoded);
            this.clearDescriptorIdInput();
            this.getById().descriptorIdInput.setValueState(sap.ui.core.ValueState.None);
            this.checkAddDescriptorButton();

          } else {
            MessageToast.show(response.statusText);
          }
        }).catch(err => {
          console.error(err)
        })
      } else {
        MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("cantBeEmpty"));
      }

    },

    // Delete a role from the SemanticProtocol
    onDeleteRoleObject: function (oEvent) {
      var oItem = oEvent.getParameter('listItem');
      var oCtx = oItem.getBindingContext("SingleSemanticProtocol");
      var path = oCtx.getPath();
      var idx = path.charAt(path.lastIndexOf('/') + 1);

      var localSemanticProtocol = this.getView().getModel("SingleSemanticProtocol");
      var roles = localSemanticProtocol.getProperty("/roles");

      //var oModel = this.getView().getModel("SingleSemanticProtocol");
      var roleCount = localSemanticProtocol.getProperty("/roles").length;

      if (roleCount > 1) {

        roles.splice(idx, 1);

        localSemanticProtocol.setProperty("/roles", roles);
        var localSemanticProtocolData = localSemanticProtocol.getProperty("/");

        fetch("/endpoint-registry/admin/semanticProtocols", {
          method: "PUT",
          body: JSON.stringify(localSemanticProtocolData),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }).then((response) => {
          if (response.ok) {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("roleDeleted"));
          } else {
            MessageToast.show(response.statusText);
          }
        }).catch(err => {
          console.error(err)
        })
      } else {
        MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("roleMandatory"));
      }
      this.showDetailsOfRoleWithIndex(idx);
    },

    // Add a new Descriptor to the selected Role of the SemanticProtocol
    onAddDescriptor: function () {
      var rolePath = this.getById().roleDetail.getElementBinding("SingleSemanticProtocol").getPath();
      var localDescriptors = this.getView().getModel("SingleSemanticProtocol").getProperty(rolePath + "/aasDescriptorIds");
      var oMainObject = {};
      if (this.getById().descriptorIdInput.getSelectedItem() !== null) {
        oMainObject["id"] = this.getById().descriptorIdInput.getSelectedItem().getText();
        localDescriptors.push(oMainObject);

        var SPId = this.getView().getModel("SingleSemanticProtocol").getProperty("/identification/id");
        var SPIdEncoded = encodeURIComponent(SPId);

        var roleName = this.getView().getModel("SingleSemanticProtocol").getProperty(rolePath + "/name");
        var roleNameEncoded = encodeURIComponent(roleName);

        fetch("/endpoint-registry/semanticProtocols/" + SPIdEncoded + "/role/" + roleNameEncoded + "/AASDescriptors", {
          method: "PATCH",
          body: JSON.stringify(localDescriptors),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }).then((response) => {
          if (response.ok) {
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("descriptorAdded"));
            this.setSingleSemanticProtocol(SPIdEncoded);

          } else {
            MessageToast.show(response.statusText);
          }
        }).catch(err => {
          console.error(err)
        })
        this.clearDescriptorIdInput();
      } else {
        MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("NoDescriptorSelected"));
      }

    },

    // Delete a Descriptor from the selected Role
    onDeleteDescriptor: function (oEvent) {
      var SPId = this.getView().getModel("SingleSemanticProtocol").getProperty("/identification/id");
      var SPIdEncoded = encodeURIComponent(SPId);
      var rolePath = this.getById().roleDetail.getElementBinding("SingleSemanticProtocol").getPath();

      var roleName = this.getView().getModel("SingleSemanticProtocol").getProperty(rolePath + "/name");
      var roleNameEncoded = encodeURIComponent(roleName);

      var oItem = oEvent.getParameter('listItem');
      var oCtx = oItem.getBindingContext("SingleSemanticProtocol");
      var descriptorPath = oCtx.getPath();
      var descriptorId = this.getView().getModel("SingleSemanticProtocol").getProperty(descriptorPath + "/id");
      var descriptorIdEncoded = encodeURIComponent(descriptorId);


      fetch("/endpoint-registry/semanticProtocols/" + SPIdEncoded + "/role/" + roleNameEncoded + "/AASDescriptors/" + descriptorIdEncoded, {
        method: "DELETE"
      }).then((response) => {
        if (response.ok) {
          MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("descriptorDeleted"));
          this.setSingleSemanticProtocol(SPIdEncoded);
        } else {
          MessageToast.show(response.statusText);
        }
      }).catch(err => {
        console.error(err)
      })

      this.clearDescriptorIdInput();
      this.getById().descriptorIdInput.setValueState(sap.ui.core.ValueState.None);
      this.checkAddDescriptorButton();
    },

    clearDescriptorIdInput: function () {
      this.getById().descriptorIdInput.setSelectedItem("");

    },

    //Shows the Role with a index "index" in the detail screen
    showDetailsOfRoleWithIndex: function (index) {
      var oModel = this.getView().getModel("SingleSemanticProtocol");
      var roleCount = oModel.getProperty("/roles").length;
      if (index <= 0) {
        this.byId("roleDetail").bindElement("SingleSemanticProtocol>/roles/" + "0");
        if (roleCount === 0) {}
      } else if (index > roleCount - 1) {
        this.showDetailsOfLastAddedRole();
      } else {
        this.byId("roleDetail").bindElement("SingleSemanticProtocol>/roles/" + index);
      }
    },

    //Shows the last added Role in the detail screen
    showDetailsOfLastAddedRole: function () {
      var oModel = this.getView().getModel("SingleSemanticProtocol");
      var lastAddedRole = oModel.getProperty("/roles").length - 1;
      var newRolePath = "SingleSemanticProtocol>/roles/" + lastAddedRole;
      this.getById().roleDetail.bindElement(newRolePath);
    },

    onRoleObjectItemPress: function (oEvent) {
      var oItem = oEvent.getSource();
      var oCtx = oItem.getBindingContext('SingleSemanticProtocol');
      var path = oCtx.getPath();
      var namedModelPath = "SingleSemanticProtocol>" + path;
      this.getById().roleDetail.bindElement(namedModelPath);
      this.clearDescriptorIdInput();
    },

    //-----------------Begin Input Validation--------------------------//

    //Check if the Role Name already exists
    roleNameDuplicate: function (roleName) {
      var Roles = this.getView().getModel("SingleSemanticProtocol").getProperty("/roles")
      if (typeof Roles !== 'undefined' && Roles.length > 0) {
        // the array is defined and has at least one element
        for (var i = 0; i < Roles.length; i++) {
          if (roleName === Roles[i].name) {
            return true;
          }
        }

      }
      return false;

    },

    //Shows a red border around the select field as long as a duplicate selection is found
    onSelect(oEvent) {

      var newSelectedItemText = this.getById().descriptorIdInput.getSelectedItem().getText()

      this.getById().descriptorIdInput.setValueState(sap.ui.core.ValueState.None);
      this.getById().addDescriptorButton.setEnabled(true);

      // Check if Field is empty
      if (newSelectedItemText === "") {
        this.getById().descriptorIdInput.setValueState(sap.ui.core.ValueState.Error);
        this.getById().descriptorIdInput.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("cantBeEmpty"));
      }
      // Check for DescriptorId duplicate
      if (this.descriptorIdDuplicate(newSelectedItemText)) {
        this.getById().descriptorIdInput.setValueState(sap.ui.core.ValueState.Error);
        this.getById().descriptorIdInput.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("duplicate"));
      }
      this.checkAddDescriptorButton();

    },

    //Check if the DescriptorId already exists in that role
    descriptorIdDuplicate: function (descriptorId) {
      var rolePath = this.getById().roleDetail.getElementBinding("SingleSemanticProtocol").getPath();
      var Descriptors = this.getView().getModel("SingleSemanticProtocol").getProperty(rolePath + "/aasDescriptorIds")
      if (typeof Descriptors !== 'undefined' && Descriptors.length > 0) {
        // the array is defined and has at least one element
        for (var i = 0; i < Descriptors.length; i++) {
          if (descriptorId === Descriptors[i].id) {
            return true;
          }
        }

      }
      return false;

    },


    //Shows a red border around the input field as long as a empty or duplicate entry is found
    onLiveChange(oEvent) {
      var newValue = oEvent.getParameter("newValue");

      this.getById().inputRoleName.setValueState(sap.ui.core.ValueState.None);
      // Set ValueState Error and add ValueStateText if Inputfield is empty
      if (newValue === "") {
        this.getById().inputRoleName.setValueState(sap.ui.core.ValueState.Error);
        this.getById().inputRoleName.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("cantBeEmpty"));
      }
      // Set ValueState Error and add ValueStateText if Role Name Duplicate
      if (this.roleNameDuplicate(newValue)) {
        this.getById().inputRoleName.setValueState(sap.ui.core.ValueState.Error);
        this.getById().inputRoleName.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("roleNameDuplicate"));
      }
      this.checkAddRoleButton();

    },

    // Disable AddRoleButton if ValueState of roleName is Error & enable if not
    checkAddRoleButton: function () {
      if (this.getById().inputRoleName.getValueState() == "Error") {
        this.getById().addRoleButton.setEnabled(false);
      } else {
        this.getById().addRoleButton.setEnabled(true);
      }
    },

    // Disable AddDescriptorButton if ValueState of DescriptorId is Error & enable if not
    checkAddDescriptorButton: function () {
      if (this.getById().descriptorIdInput.getValueState() == "Error") {
        this.getById().addDescriptorButton.setEnabled(false);
      } else {
        this.getById().addDescriptorButton.setEnabled(true);
      }
    },

    //-----------------End Input Validation--------------------------//

    onNavBack: function () {
      var oHistory = History.getInstance();
      var sPreviousHash = oHistory.getPreviousHash();
      this.getById().inputRoleName.setValue("");
      this.clearDescriptorIdInput();
      this.getById().descriptorIdInput.setValueState(sap.ui.core.ValueState.None);
      this.getById().inputRoleName.setValueState(sap.ui.core.ValueState.None);
      this.checkAddDescriptorButton();
      this.checkAddRoleButton();

      if (sPreviousHash !== undefined) {
        window.history.go(-1);
      } else {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("overview", true);
      }
    },


  });

});
