import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  ManyToOne,
  BaseEntity,
} from "typeorm";
import { User } from "./User";
import { InvoiceItem } from "./InvoiceItem";

@Entity("invoices")
export class Invoice extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "float" })
  total: number;

  @Column()
  address: string;

  @Column()
  status: string;

  @Column()
  method: string;

  @Column()
  long: string;

  @Column()
  lat: string;

  @Column({ nullable: true })
  zcTransactionId: string;

  @Column({ nullable: true })
  zcMsisdn: string;

  @Column({ nullable: true })
  zcOperation: string;

  @Column({ nullable: true })
  zcMsg: string;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @CreateDateColumn()
  updatedAt: Date;

  // -------------------------------- Relations ------------------------

  @ManyToOne((type) => User, (user) => user.invoices)
  user: User;

  @OneToMany((type) => InvoiceItem, (item) => item.invoice)
  items: InvoiceItem[];
}
