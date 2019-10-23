interface IConversationMember {
    identification?: IIdentification;
    role: Role;
}

interface IRole {
    name: string;
}
//TODO: this has to be revised, id should be of type:"idType", schema needs to be updated
interface IIdentification {
    id: string;
    idType: string;
}

class ConversationMember implements IConversationMember {
    identification: Identification | undefined;
    role: Role;

    constructor(obj: IConversationMember) {
        this.identification = obj.identification;
        this.role = obj.role;
    }

    getRole(): Role {
        return this.role;
    }

    getIdentification(): IIdentification | undefined {
        return this.identification;
    }
}

class Role implements IRole {
    name: string;

    constructor(obj: IRole) {
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

export { ConversationMember, Role, IConversationMember };
