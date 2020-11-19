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
        jQuery.ajax({
          'async': false,
          'global': false,
          'url': "/resources/AASDescriptors",
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

      var aSemanticProtocols = (function () {
        var aSemanticProtocols = null;
        jQuery.ajax({
          'async': false,
          'global': false,
          'url': "/resources/semanticProtocols",
          'dataType': "json",
          'success': function (data) {
            aSemanticProtocols = data;
          }
        });
        return aSemanticProtocols;
      })();

      var oData = {
        "IdTypeCollection": aIdTypes,

        "AASDescriptors": aAASDescriptors,

        "CreateSPFormular": aCreateSPFormular,

        "SemanticProtocolsCollection": aSemanticProtocols
      };

      var oModel = new JSONModel(oData);
      this.getView().setModel(oModel);
    },

    onAddDescriptorDropdown: function () {
      var oController = this.getView().getController();
      var oSelect = new sap.m.Select({
        forceSelection: false,
        width: "250px",
        change: function (oEvent) {
          oController.onSelect(oEvent)
        }

      });
      var oItemTemplate = new sap.ui.core.Item({
        text: '{identification/id}', // here goes your binding for the property "Name" of your item
        //key: '{key}' //not needed???
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
        press: this.onDeleteCcMail.bind(this)
      });
      var _oCcLayout = new sap.m.FlexBox({
        alignItems: "Center",
        justifyContent: "Start",
        items: [oSelect, delIcon]
      });
      this._oPnl.addContent(_oCcLayout);

    },

    onDeleteCcMail: function (oEvent) {
      var descriptorDropdowns = this.getInputs().aasDescriptorSelect.getContent();
      // One dropdown is mandatory -> last dropdown is not deletable
      if (typeof descriptorDropdowns !== 'undefined' && descriptorDropdowns.length > 1) { 
        var rowItemContainer = oEvent.getSource().getParent();
      rowItemContainer.destroy();
      } else {
        MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("descriptorMandatory"));
    }

  },

    onAddRole: function () {
      var descriptorDropdowns = this.getInputs().aasDescriptorSelect.getContent();

      if (this.getInputs().inputRoleName.getValue() === "") {
        this.getInputs().inputRoleName.setValueState(sap.ui.core.ValueState.Error);
        this.getInputs().inputRoleName.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("cantBeEmpty"));
        MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("cantBeEmpty"));
        this.checkAddRoleButton();
      } else if (this.aasDescriptorDuplicateOrEmpty()) {
        MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("descriptorDuplicateOrEmpty"), {
          duration: 5000
        });
        for (var i = 0; i < descriptorDropdowns.length; i++) {
          descriptorDropdowns[i].getItems()[0].setValueState(sap.ui.core.ValueState.Error);
          descriptorDropdowns[i].getItems()[0].setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("descriptorDuplicateOrEmpty"));
        }
      } else {
        var oModel = this.getView().getModel();
        var localdata = oModel.getProperty("/CreateSPFormular");

        var oMainObject = {};
        oMainObject["name"] = this.byId("InputRoleName").getValue();
        var aMainObjectArray = new Array();
        var oObject = {};

        for (var i = 0; i < descriptorDropdowns.length; i++) {
          oObject["id"] = descriptorDropdowns[i].getItems()[0].getSelectedItem().getText();
          aMainObjectArray.push(JSON.parse(JSON.stringify(oObject)));
        }

        oMainObject["aasDescriptorIds"] = aMainObjectArray;

        localdata.roles.push(oMainObject);
        oModel.setProperty("/CreateSPFormular", localdata);
        this.resetDescriptorDropdown();
        MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("roleCreated"));
        this.byId("InputRoleName").setValue("");

        this.showDetailsOfLastAddedRole();
        this.enableSplitscreen();
      }
    },

    showDetailsOfLastAddedRole: function () {
      var oModel = this.getView().getModel();
      var lastAddedRole = oModel.getProperty("/CreateSPFormular/roles").length - 1;
      var newRolePath = "/CreateSPFormular/roles/" + lastAddedRole;
      this.byId("roleDetail").bindElement(newRolePath);
    },

    showDetailsOfRoleWithIndex: function (index) {
      var oModel = this.getView().getModel();
      var roleCount = oModel.getProperty("/CreateSPFormular/roles").length;
      if (index <= 0) {
        this.byId("roleDetail").bindElement("/CreateSPFormular/roles/" + "0");
        if (roleCount === 0) {
          this.disableSplitscreen();
        }
      } else if (index > roleCount - 1) {
        this.showDetailsOfLastAddedRole();
      } else {
        this.byId("roleDetail").bindElement("/CreateSPFormular/roles/" + index);
      }
    },

    enableSplitscreen: function () {
      this.byId("roleDetail").setVisible(true);
      this.byId("splitterSize").setSize("500px");
      this.byId("splitterSize").setResizable(true);
    },

    disableSplitscreen: function () {
      this.byId("roleDetail").setVisible(false);
      this.byId("splitterSize").setSize("100%");
      this.byId("splitterSize").setResizable(false);
    },

    onRoleObjectItem: function (oEvent) {
      var oItem = oEvent.getSource();
      var oCtx = oItem.getBindingContext();
      var path = oCtx.getPath();
      this.byId("roleDetail").bindElement(path);
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

        var oList = this.byId("RoleList");
        oList.getBinding("items").refresh(true);
      }
      this.showDetailsOfRoleWithIndex(idx);
    },

    onCreateSemanticProtocol: function () {
      if (this.getInputs().inputSpId.getValue() === "") {
        this.getInputs().inputSpId.setValueState(sap.ui.core.ValueState.Error);
        this.getInputs().inputSpId.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("cantBeEmpty"));
        MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("cantBeEmpty"));
        this.checkCreateButton();

      } else if (!this.roleAdded()) {
        //this.getInputs().inputRoleName.setValueState(sap.ui.core.ValueState.Warning);
        this.getInputs().inputRoleName.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("noRoleAdded"));
        MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("noRoleAdded"), {
          duration: 5000
        });
      } else {
        var that = this;
        var lv_data = this.getView().getModel().getProperty("/CreateSPFormular");
        var lv_dataString = JSON.stringify(lv_data);

        jQuery.ajax({
          url: '/resources/semanticProtocols',
          type: 'PUT',
          contentType: "application/json",
          dataType: "json",
          data: lv_dataString
        }).always(function (data, status, response) {
          if (status === "success") {
            MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("semanticProtocolCreated"));
            that.resetScreenToInitial();
          } else {
            MessageToast.show(status + ": " + response);
          }

        });

      }

    },

    //-----------------Begin Input Validation--------------------------//
    getInputs: function () {
      return {
        inputSpId: this.byId("InputSpId"),
        inputRoleName: this.byId("InputRoleName"),
        createButton: this.byId("CreateButton"),
        addRoleButton: this.byId("AddRoleButton"),
        aasDescriptorSelect: this.byId("idPnl")
      }
    },

    //Check if the Semantic Protocol ID already exists
    spIdDuplicate: function (spId) {
      var SemanticProtocols = this.getView().getModel().getProperty("/SemanticProtocolsCollection")
      for (var i = 0; i < SemanticProtocols.length; i++) {
        if (spId === SemanticProtocols[i].identification.id) {
          return true;
        }
      }
      return false;
    },

    //Check if the Role Name already exists
    roleNameDuplicate: function (roleName) {
      var Roles = this.getView().getModel().getProperty("/CreateSPFormular/roles")
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

    //Check if a Role is already added
    roleAdded: function () {
      var Roles = this.getView().getModel().getProperty("/CreateSPFormular/roles")
      if (typeof Roles !== 'undefined' && Roles.length > 0) {
        return true;
      }
      return false;

    },

    // Check if a AASDescriptor already is choosen in a other dropdown or a dropdown ist empty
    aasDescriptorDuplicateOrEmpty: function () {
      var descriptorDropdowns = this.getInputs().aasDescriptorSelect.getContent();


      if (typeof descriptorDropdowns !== 'undefined' && descriptorDropdowns.length > 0) {

        for (var i = 0; i < Math.round(descriptorDropdowns.length / 2); i++) { //Just need to compare the first half of the objects with all other objects
          var count = 0;
          for (var j = 0; j < descriptorDropdowns.length; j++) {
            //Return true if dropdown j is empty
            if (descriptorDropdowns[j].getItems()[0].getSelectedItem() === null) {
              return true;
            } else if (descriptorDropdowns[i].getItems()[0].getSelectedItem().getText() ===
              descriptorDropdowns[j].getItems()[0].getSelectedItem().getText()) {
              count++;
              // count = 1 if its self -> count > 1 means there is a duplicate
              if (count > 1) {
                return true;
              }
            }
          }
        }

      }
      return false;

    },

    //Shows a red border around the select field as long as a duplicate selection is found
    onSelect(oEvent) {
      var id = oEvent.getParameter("id");
      var newSelectedItemText = oEvent.getParameter('selectedItem').getText();
      var inputControl = sap.ui.getCore().byId(id);
      var descriptorDropdowns = this.getInputs().aasDescriptorSelect.getContent();

      inputControl.setValueState(sap.ui.core.ValueState.None);
      this.getInputs().addRoleButton.setEnabled(true);


      if (typeof descriptorDropdowns !== 'undefined' && descriptorDropdowns.length > 0) {
        var count = 0;
        for (var i = 0; i < descriptorDropdowns.length; i++) {
          if (descriptorDropdowns[i].getItems()[0].getSelectedItem() !== null && newSelectedItemText === descriptorDropdowns[i].getItems()[0].getSelectedItem().getText()) {
            count++;
            // count = 1 is its self -> count > 1 means there is a duplicate
            if (count > 1) {
              inputControl.setValueState(sap.ui.core.ValueState.Error);
              inputControl.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("descriptorDuplicateOrEmpty"));
            } else {
              inputControl.setValueState(sap.ui.core.ValueState.None);
            }
          }
        }
      }

    },


    //Shows a red border around the input field as long as a empty or duplicate entry is found
    onLiveChange(oEvent) {
      var id = oEvent.getParameter("id");
      var newValue = oEvent.getParameter("newValue");
      var inputControl = this.byId(id);

      inputControl.setValueState(sap.ui.core.ValueState.None);
      this.getInputs().createButton.setEnabled(true);
      // Check if Field is empty
      if (newValue === "") {
        inputControl.setValueState(sap.ui.core.ValueState.Error);
        inputControl.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("cantBeEmpty"));
      }
      // Only check for duplicate if Inputfield is identification/id
      if (inputControl === this.getInputs().inputSpId && this.spIdDuplicate(newValue)) {
        inputControl.setValueState(sap.ui.core.ValueState.Error);
        inputControl.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("duplicate"));
      }
      // Only check for duplicate if Inputfield is roles/name
      if (inputControl === this.getInputs().inputRoleName && this.roleNameDuplicate(newValue)) {
        inputControl.setValueState(sap.ui.core.ValueState.Error);
        inputControl.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("roleNameDuplicate"));
      }
      this.checkCreateButton();
      this.checkAddRoleButton();

    },
    // Disable CreateButton if ValueState of spId or endpointAdress is Error & enable if not
    checkCreateButton: function () {
      if (this.getInputs().inputSpId.getValueState() == "Error") {
        this.getInputs().createButton.setEnabled(false);
      } else {
        this.getInputs().createButton.setEnabled(true);
      }
    },

    // Disable AddRoleButton if ValueState of roleName, spId or endpointAdress is Error & enable if not
    checkAddRoleButton: function () {
      if (this.getInputs().inputRoleName.getValueState() == "Error") {
        this.getInputs().addRoleButton.setEnabled(false);
      } else {
        this.getInputs().addRoleButton.setEnabled(true);
      }
    },

    //-----------------End Input Validation--------------------------//

    resetScreenToInitial: function () {
      this.byId("InputRoleName").setValue("");
      this.resetDescriptorDropdown();
      this.initiateModel();
      this.disableSplitscreen();
      this.getInputs().inputSpId.setValueState(sap.ui.core.ValueState.None);
      this.getInputs().inputRoleName.setValueState(sap.ui.core.ValueState.None);
      this.checkCreateButton();
      this.checkAddRoleButton();
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
