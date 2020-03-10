import { ISubmodel, InteractionMessage } from 'i40-aas-objects';

import { SkillActionMap } from '../../services/onboarding/SkillActionMap';

interface ISkillContext {
  responseInstance?: ISubmodel;
  message: InteractionMessage;
  actionMap: SkillActionMap;
  configuration: object;
}
export { ISkillContext };
