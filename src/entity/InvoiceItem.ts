import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  ManyToOne,
  BaseEntity,
} from "typeorm";
import { Invoice } from "./Invoice";
import { Product } from "./Product";

@Entity("invoiceItems")
export class InvoiceItem extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quantity: number;

  @Column()
  subtotal: number;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @CreateDateColumn()
  updatedAt: Date;

  // -------------------------------- Relations --------------------------------

  @ManyToOne((type) => Invoice, (invoice) => invoice.items)
  invoice: Invoice;

  @ManyToOne((type) => Product, (product) => product.items)
  product: Product;
}
