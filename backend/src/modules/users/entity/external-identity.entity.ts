import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('external_identities')
@Index(['provider', 'subject'], { unique: true })
export class ExternalIdentity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'text' })
  userId!: string;

  @Column({ type: 'text' })
  provider!: string;

  @Column({ type: 'text' })
  subject!: string;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
