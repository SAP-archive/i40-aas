import { InteractionMessage, ISubmodel } from "i40-aas-objects";
import { SkillActionMap } from "../SkillActionMap";

interface ISkillContext {
  responseInstance?: ISubmodel;
  message: InteractionMessage;
  actionMap: SkillActionMap;
  askForType: boolean;
  askForApproval: boolean;
}
export { ISkillContext };
