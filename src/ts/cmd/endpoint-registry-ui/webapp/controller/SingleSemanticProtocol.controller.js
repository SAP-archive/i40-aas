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
        roleDetail: this.byId("roleDetail"),
        descriptorId: this.byId("DescriptorId")
      }
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

      this.initiateModel(iSPId);
      this


    },

    initiateModel: function (SPIdEncoded) {

      // Set model for the SemanticProtocol with a specific SemanticProtocolId
      var oModelSingleSemanticProtocol = new JSONModel();
      this.getView().setModel(oModelSingleSemanticProtocol, "SingleSemanticProtocol");
      oModelSingleSemanticProtocol.loadData("/endpoint-registry/semanticProtocols/" + SPIdEncoded);

      //Set model for exisiting Descriptors
      var oModelAASDescriptors = new JSONModel();
      this.getView().setModel(oModelAASDescriptors, "AASDescriptorsCollection");
      oModelAASDescriptors.loadData("/endpoint-registry/AASDescriptors");
    },


    // Add a new Role to the SemanticProtocol
    onAddRole: function () {
      var SPId = this.getView().getModel("SingleSemanticProtocol").getProperty("/identification/id");
      var SPIdEncoded = encodeURIComponent(SPId);
      var localSemanticProtocol = this.getView().getModel("SingleSemanticProtocol").getProperty("/");
      var oMainObject = {};
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
          this.initiateModel(SPIdEncoded);


        } else {
          MessageToast.show(response.statusText);
        }
      }).catch(err => {
        console.error(err)
      })
    },

    // Delete a role from the SemanticProtocol
    onDeleteRoleObject: function (oEvent) {
      var oItem = oEvent.getParameter('listItem');
      var oCtx = oItem.getBindingContext("SingleSemanticProtocol");
      var path = oCtx.getPath();
      var idx = path.charAt(path.lastIndexOf('/') + 1);

      var localSemanticProtocol = this.getView().getModel("SingleSemanticProtocol");
      var roles = localSemanticProtocol.getProperty("/roles");

      var oModel = this.getView().getModel("SingleSemanticProtocol");
      var roleCount = oModel.getProperty("/roles").length;

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
            //this.initiateModel(SPId);
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
      debugger;

      var rolePath = this.getById().roleDetail.getElementBinding("SingleSemanticProtocol").getPath();
      var localDescriptors = this.getView().getModel("SingleSemanticProtocol").getProperty(rolePath + "/aasDescriptorIds");
      var oMainObject = {};
      oMainObject["id"] = this.getById().descriptorId.getSelectedItem().getText();
      localDescriptors.push(oMainObject);

      var SPId = this.getView().getModel("SingleSemanticProtocol").getProperty("/identification/id");
      var SPIdEncoded = encodeURIComponent(SPId);
      var roleName = this.getView().getModel("SingleSemanticProtocol").getProperty(rolePath + "/name");

      fetch("/endpoint-registry/semanticProtocols/" + SPId+ "/role/" +roleName+ "/AASDescriptors", {
        method: "PATCH",
        body: JSON.stringify(localDescriptors),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }).then((response) => {
        if (response.ok) {
          MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("descriptorAdded"));
          //this.getById().descriptorId.setValue("");

          //this.showDetailsOfLastAddedRole();
          this.initiateModel(SPIdEncoded);
        } else {
          MessageToast.show(response.statusText);
        }
      }).catch(err => {
        console.error(err)
      })
    },

    //Shows the Role with a index "index" in the detail screen
    showDetailsOfRoleWithIndex: function (index) {
      var oModel = this.getView().getModel("SingleSemanticProtocol");
      var roleCount = oModel.getProperty("/roles").length;
      if (index <= 0) {
        this.byId("roleDetail").bindElement("SingleSemanticProtocol>/roles/" + "0");
        if (roleCount === 0) {
          //this.disableSplitscreen();
        }
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


    // //Shows a red border around the select field as long as a duplicate selection is found
    // onSelect(oEvent) {
    //   var id = oEvent.getParameter("id");
    //   var newSelectedItemText = oEvent.getParameter('selectedItem').getText();
    //   var inputControl = sap.ui.getCore().byId(id);
    //   var descriptorDropdowns = this.getById().aasDescriptorSelect.getContent();

    //   inputControl.setValueState(sap.ui.core.ValueState.None);
    //   this.getById().addRoleButton.setEnabled(true);


    //   if (typeof descriptorDropdowns !== 'undefined' && descriptorDropdowns.length > 0) {
    //     var count = 0;
    //     for (var i = 0; i < descriptorDropdowns.length; i++) {
    //       if (descriptorDropdowns[i].getItems()[0].getSelectedItem() !== null && newSelectedItemText === descriptorDropdowns[i].getItems()[0].getSelectedItem().getText()) {
    //         count++;
    //         // count = 1 is its self -> count > 1 means there is a duplicate
    //         if (count > 1) {
    //           inputControl.setValueState(sap.ui.core.ValueState.Error);
    //           inputControl.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("descriptorDuplicate"));
    //         } else {
    //           inputControl.setValueState(sap.ui.core.ValueState.None);
    //         }
    //       }
    //     }
    //   }

    // },


    //Shows a red border around the input field as long as a empty or duplicate entry is found
    onLiveChange(oEvent) {
      var id = oEvent.getParameter("id");
      var newValue = oEvent.getParameter("newValue");
      var inputControl = this.byId(id);

      inputControl.setValueState(sap.ui.core.ValueState.None);
      // Check if Field is empty
      if (newValue === "") {
        inputControl.setValueState(sap.ui.core.ValueState.Error);
        inputControl.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("cantBeEmpty"));
      }
      // Only check for duplicate if Inputfield is roles/name
      if (inputControl === this.getById().inputRoleName && this.roleNameDuplicate(newValue)) {
        inputControl.setValueState(sap.ui.core.ValueState.Error);
        inputControl.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("roleNameDuplicate"));
      }
      this.checkAddRoleButton();

    },

    // Disable AddRoleButton if ValueState of roleName, spId or endpointAdress is Error & enable if not
    checkAddRoleButton: function () {
      if (this.getById().inputRoleName.getValueState() == "Error") {
        this.getById().addRoleButton.setEnabled(false);
      } else {
        this.getById().addRoleButton.setEnabled(true);
      }
    },

    //-----------------End Input Validation--------------------------//

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
