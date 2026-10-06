import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('service_status')
@Index(['systemId', 'timestamp'])
export class ServiceStatus {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'system_id', type: 'text' })
  systemId!: string;

  @Column({ name: 'timestamp', type: 'timestamptz' })
  timestamp!: Date;

  @Column({ type: 'boolean' })
  available!: boolean;

  @Column({ type: 'float' })
  flow!: number;

  @Column({ type: 'text' })
  quality!: string;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;
}
