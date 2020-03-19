import { ISubmodel, InteractionMessage } from 'i40-aas-objects';

import { MySkillActionMap } from '../../services/onboarding/MySkillActionMap';

interface ISkillContext {
  responseInstance?: ISubmodel;
  message: InteractionMessage;
  actionMap: MySkillActionMap;
  configuration: object;
}
export { ISkillContext };
