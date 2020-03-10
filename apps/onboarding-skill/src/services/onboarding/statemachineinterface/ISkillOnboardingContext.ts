import { InteractionMessage, ISubmodel } from 'i40-aas-objects';
import { SkillActionMap } from '../SkillActionMap';
import { ISkillContext } from '../../../base/statemachineinterface/ISkillContext';

interface ISkillOnboardingContext extends ISkillContext {
  askForType: boolean;
  askForApproval: boolean;
}
export { ISkillOnboardingContext };
