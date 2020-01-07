/**
 * The topic to which an interaction should be published
 */

 interface ITopicStructure {
    semanticProtocol: string;
    receiverRole: string; //soll es URI sein?
    //TODO: type should be imported from models (is there an enum??)
    type: string

 }

 class BrokerInteractionTopic implements ITopicStructure{
    semanticProtocol: string;
    receiverRole: string;
    type: string;


    constructor(semProtocol:string, receiverRole:string, type:string){
        this.receiverRole = this.noDots(receiverRole);
        this.semanticProtocol= this.noDots(semProtocol);
        this.type = this.noDots(type);

    }

    noDots = (str:string) => str.replace(".","-");

    removeDots(str:string){
        return str.replace(".","-");
    }

    getTopic():string {
        return this.semanticProtocol+"."+this.receiverRole+"."+this.type;
          //TODO: should we check for special characters?
 }
 }
 export {BrokerInteractionTopic}
