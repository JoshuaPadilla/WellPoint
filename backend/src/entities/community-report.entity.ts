import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('community_reports')
export class CommunityReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  reporter!: string;

  @Column({ type: 'text' })
  area!: string;

  @Column({ name: 'psgc_code', type: 'text', nullable: true })
  psgcCode!: string | null;

  @Column({ name: 'community_id', type: 'text', nullable: true })
  communityId!: string | null;

  @Column({ type: 'text' })
  type!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', default: 'new' })
  status!: string;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
