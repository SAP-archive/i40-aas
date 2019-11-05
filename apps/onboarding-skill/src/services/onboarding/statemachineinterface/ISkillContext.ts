import { InteractionMessage, SubmodelInterface } from "i40-aas-objects";
import { SkillActionMap } from "../SkillActionMap";

interface ISkillContext {
  responseInstance?: SubmodelInterface;
  message: InteractionMessage;
  actionMap: SkillActionMap;
  askForType: boolean;
  askForApproval: boolean;
}
export { ISkillContext };
