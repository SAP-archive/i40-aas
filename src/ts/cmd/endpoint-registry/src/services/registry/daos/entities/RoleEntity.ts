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

  @ManyToMany(type => AASDescriptorEntity, aasDescriptor => aasDescriptor.roles, {onUpdate:'CASCADE', onDelete: 'CASCADE', eager:true})
  aasDescriptorIds!: AASDescriptorEntity[];


  @ManyToOne(type => SemanticProtocolEntity, semanticProtocol => semanticProtocol.roles, { onUpdate:'CASCADE',onDelete: 'CASCADE' })
  @JoinTable()
  semProtocol!: SemanticProtocolEntity;

}

