import { Entity, Column, PrimaryGeneratedColumn, Unique, ManyToOne, PrimaryColumn, OneToMany } from "typeorm";
import { RoleEntity } from "./RoleEntity";

@Entity()
export class SemanticProtocolEntity {

  @PrimaryColumn()
  id!: string;

  @Column()
  idType!: string;

  //Role : many SemanticProtocols
  @OneToMany(type => RoleEntity, role => role.semProtocol, { cascade: true, eager: true })
  roles!: RoleEntity[];

}
