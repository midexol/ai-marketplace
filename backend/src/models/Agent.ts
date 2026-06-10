import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { AgentToken } from './AgentToken';
import { Trade } from './Trade';
import { Portfolio } from './Portfolio';

@Entity('agents')
@Index(['creatorAddress'])
@Index(['type'])
@Index(['createdAt'])
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 42 })
  creatorAddress: string;

  @Column({ type: 'varchar', length: 20 })
  type: 'writing' | 'research' | 'governance' | 'butler';

  @Column({ type: 'varchar', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'simple-json', default: '{}' })
  tokenAddresses: Record<string, string>;

  @Column({ type: 'simple-array', default: '' })
  chains: string[];

  @Column({ type: 'bigint', default: 0 })
  totalHolders: number;

  @Column({ type: 'text', default: '0' })
  marketCap: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => AgentToken, (token) => token.agent, { cascade: true })
  tokens: AgentToken[];

  @OneToMany(() => Trade, (trade) => trade.agent, { cascade: false })
  trades: Trade[];

  @OneToMany(() => Portfolio, (portfolio) => portfolio.agent, { cascade: false })
  portfolios: Portfolio[];
}
