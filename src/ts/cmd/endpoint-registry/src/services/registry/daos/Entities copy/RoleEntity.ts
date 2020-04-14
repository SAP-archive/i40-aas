import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne,JoinTable,Unique } from "typeorm";
import { SemanticProtocolEntity } from "./SemanticProtocolEntity";


@Entity()

@Unique("singleRoleNameForProtocol", ["name", "semProtocol"])

export class RoleEntity {
  @PrimaryGeneratedColumn()
  id!: string;

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
    @JoinTable()
    semProtocol!: SemanticProtocolEntity;

}
