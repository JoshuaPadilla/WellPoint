import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('alert')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: 'shortage' | 'contamination' | 'outage';

  @Column()
  severity: 'info' | 'warning' | 'critical';

  @Column()
  area: string;

  @Column({ type: 'varchar', nullable: true })
  systemId: string | null;

  @Column({ type: 'varchar', nullable: true })
  reportId: string | null;

  @Column({ type: 'timestamp' })
  raisedAt: Date;

  @Column({ default: 'active' })
  status: 'active' | 'resolved';

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text' })
  action: string;

  @Column({ type: 'varchar', nullable: true })
  impactNote: string | null;

  @Column({ default: 0 })
  priority: number;
}
