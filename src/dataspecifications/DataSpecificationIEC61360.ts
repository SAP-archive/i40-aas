import { Reference } from '../characteristics/interfaces/Reference';

interface DataspecificationIEC61360Interface {
    preferredName?: string;
    shortName?: string;
    unit?: string;
    unitId?: Reference;
    sourceOfDefinition?: Reference;
    symbol?: string;
    dataType?: string;
    definition?: string;
    valueFormat?: string;
    valueList?: string;
    code?: string;
}
class DataspecificationIEC61360 implements DataspecificationIEC61360Interface {
    preferredName?: string | undefined;
    shortName?: string | undefined;
    unit?: string | undefined;
    unitId?: Reference | undefined;
    sourceOfDefinition?: Reference | undefined;
    symbol: string | undefined;
    dataType: string | undefined;
    definition?: string | undefined;
    valueFormat?: string | undefined;
    valueList?: string | undefined;
    code?: string | undefined;
    constructor(obj: DataspecificationIEC61360Interface) {
        this.preferredName = obj.preferredName;
        this.shortName = obj.shortName;
        this.unit = obj.unit;
        this.unitId = obj.unitId;
        this.sourceOfDefinition = obj.sourceOfDefinition;
        this.symbol = obj.symbol;
        this.dataType = obj.dataType;
        this.definition = obj.definition;
        this.valueFormat = obj.valueFormat;
        this.valueList = obj.valueList;
        this.code = obj.valueList;
    }
}

export { DataspecificationIEC61360 };
