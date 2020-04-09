import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { SemanticProtocolEntity } from "./SemanticProtocolEntity";


@Entity()
export class RoleEntity {


  @PrimaryGeneratedColumn()
  roleId!: string;

    //TODO: the type could be enum if the AASObjects used enum
    //instead of union type for Identifier
    /*
    @Column( {type: "enum",
    enum: IdTypeEnum,
    default: IdTypeEnum.Custom}
    )*/
    @Column()
    name!: string;


    @ManyToOne(type => SemanticProtocolEntity, semanticProtocol => semanticProtocol.roles,{onDelete: 'CASCADE'})
    semProtocol!: SemanticProtocolEntity;

}
