import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne,JoinTable,Unique, ManyToMany } from "typeorm";
import { SemanticProtocolEntity } from "./SemanticProtocolEntity";
import { AASDescriptorEntity } from "./AASDescriptorEntity";


@Entity()

@Unique("singleRoleNameForProtocol", ["name", "semProtocol"])

export class RoleEntity {
  @PrimaryColumn()
  id!: string;

    @Column()
    name!: string;

    @ManyToMany(type => AASDescriptorEntity, aasDescriptor => aasDescriptor.roles)
    aasDescriptors!: AASDescriptorEntity[];


    @ManyToOne(type => SemanticProtocolEntity, semanticProtocol => semanticProtocol.roles,{onDelete: 'CASCADE'})
    @JoinTable()
    semProtocol!: SemanticProtocolEntity;

}
