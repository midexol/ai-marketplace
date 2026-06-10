import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Portfolio } from './Portfolio';

@Entity('users')
@Index(['address'], { unique: true })
@Index(['createdAt'])
export class User {
  @PrimaryColumn({ type: 'varchar', length: 42 })
  address: string;

  @Column({ type: 'varchar', nullable: true })
  ensName?: string;

  @Column({ type: 'varchar', nullable: true })
  username?: string;

  @Column({ type: 'varchar', nullable: true })
  profileImage?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'simple-json', default: '{}' })
  metadata: Record<string, any>;

  @Column({ type: 'text', default: '0' })
  totalPortfolioValue: string;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Portfolio, (portfolio) => portfolio.user, { cascade: false })
  portfolios: Portfolio[];
}
