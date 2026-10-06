import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('memberships')
@Index(['userId'])
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'text' })
  userId!: string;

  @Column({ type: 'text' })
  role!: string;

  @Column({ name: 'lgu_id', type: 'text', default: 'catbalogan' })
  lguId!: string;

  @Column({ name: 'barangay_psgc', type: 'text', nullable: true })
  barangayPsgc!: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
