import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne, JoinTable, Unique, ManyToMany } from "typeorm";
import { SemanticProtocolEntity } from "./SemanticProtocolEntity";
import { AASDescriptorEntity } from "./AASDescriptorEntity";


@Entity()

@Unique("uniqueRoleNameForProtocol", ["name", "semProtocol"])

export class RoleEntity {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  name!: string;

  @ManyToMany(type => AASDescriptorEntity, aasDescriptor => aasDescriptor.roles, {eager:true, onUpdate:'CASCADE'})
  aasDescriptorIds!: AASDescriptorEntity[];


  @ManyToOne(type => SemanticProtocolEntity, semanticProtocol => semanticProtocol.roles, {onDelete: 'CASCADE', onUpdate:'CASCADE'})
  semProtocol!: SemanticProtocolEntity;

}

