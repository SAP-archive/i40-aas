import { IdTypeEnum } from '../../types/IdTypeEnum';
import { KeyElementsEnum } from '../../types/KeyElementsEnum';

interface Key {
    idType: IdTypeEnum;
    local: boolean;
    type: KeyElementsEnum;
    value?: string;
}

export { Key };
