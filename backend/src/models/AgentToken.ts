import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Agent } from './Agent';
import { Portfolio } from './Portfolio';

@Entity('agent_tokens')
@Index(['agentId', 'chain'], { unique: true })
@Index(['contractAddress'])
export class AgentToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  agentId: string;

  @Column({ type: 'varchar', length: 50 })
  chain: string;

  @Column({ type: 'varchar', length: 42 })
  contractAddress: string;

  @Column({ type: 'text', default: '0' })
  totalSupply: string;

  @Column({ type: 'text', default: '0' })
  circulatingSupply: string;

  @Column({ type: 'text', default: '0' })
  price: string;

  @Column({ type: 'text', default: '0' })
  marketCap: string;

  @Column({ type: 'real', default: 0 })
  priceChange24h: number;

  @Column({ type: 'text', default: '0' })
  volume24h: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Agent, (agent) => agent.tokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: Agent;

  @OneToMany(() => Portfolio, (portfolio) => portfolio.agentToken, { cascade: false })
  portfolios: Portfolio[];
}
