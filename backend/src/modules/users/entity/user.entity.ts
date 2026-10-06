import { UserRoles } from '../../../common/enum/user_roles.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  name!: string;

  /** scrypt `salt:hash`. Hidden from normal queries. */
  @Column({ type: 'varchar', select: false, nullable: true })
  password!: string | null;

  @Column({ type: 'enum', enum: UserRoles, default: UserRoles.PENDING })
  role!: UserRoles;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
