import {Entity, Column, PrimaryGeneratedColumn, Unique, ManyToOne, Index, PrimaryColumn, JoinTable, ManyToMany} from "typeorm";
import { AASDescriptorEntity } from "./AASDescriptorEntity";

@Entity()
export class EndpointEntity {
  //the combination for address and type should also be unique (to avoid saving double)
  // @PrimaryColumn()
  // id!: string;
  @PrimaryColumn({
    length: 1024
  })
  //TODO: validate here if this is a valid URL format
  address!: string;

  @PrimaryColumn({
  length: 1024
  })
  type!: string;

  @Column({
    length: 1024,
    nullable: true,
    default: "cloud"
  })
  target?: string;

  @Column({
    length: 2048,
    nullable: true
  })
  user?: string;

  @Column({
    length: 2048,
    nullable: true
  })
  password?: string;

  @Column({
    length: 2048,
    nullable: true
  })
  salt?: string;

  //m AASDescriptor : n Endpoints
  @ManyToMany(type => AASDescriptorEntity, aasdescriptor => aasdescriptor.endpoints, { onUpdate: 'CASCADE', onDelete: 'CASCADE'})
  aasdescriptorIds!: AASDescriptorEntity[];
}
