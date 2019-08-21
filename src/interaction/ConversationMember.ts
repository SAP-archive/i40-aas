interface IConversationMember {
    type?: object;
    identification: IIdentification;

    role: Role;
}

interface IRole {
    type?: object;
    name: string;
}
//TODO: this has to be revised, id should be of type:"idType", schema needs to be updated
interface IIdentification {
    id: string;
    idType: string;
}

class ConversationMember implements IConversationMember {
    type?: object | undefined;
    identification: Identification;
    role: Role;

    constructor(obj: IConversationMember) {
        this.type = obj.type;
        this.identification = obj.identification;
        this.role = obj.role;
    }

    getRole(): Role {
        return this.role;
    }

    getIdentification(): IIdentification {
        return this.identification;
    }
}

class Role implements IRole {
    type?: object | undefined;
    name: string;

    constructor(obj: IRole) {
        this.type = obj.type;
        this.name = obj.name;
    }
}

class Identification implements IIdentification {
    id: string;
    idType: string;

    constructor(obj: IIdentification) {
        this.id = obj.id;
        this.idType = obj.idType;
    }
}

export { ConversationMember, Role };
