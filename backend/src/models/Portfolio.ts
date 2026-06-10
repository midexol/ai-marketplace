import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Agent } from './Agent';
import { User } from './User';
import { AgentToken } from './AgentToken';

@Entity('portfolios')
@Index(['userAddress', 'agentId', 'chain'], { unique: true })
@Index(['userAddress'])
@Index(['agentId'])
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 42 })
  userAddress: string;

  @Column({ type: 'varchar' })
  agentId: string;

  @Column({ type: 'varchar', nullable: true })
  agentTokenId?: string;

  @Column({ type: 'varchar', length: 50 })
  chain: string;

  @Column({ type: 'text', default: '0' })
  balance: string;

  @Column({ type: 'text', default: '0' })
  currentPrice: string;

  @Column({ type: 'text', default: '0' })
  currentValue: string;

  @Column({ type: 'text', default: '0' })
  averageBuyPrice: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.portfolios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userAddress', referencedColumnName: 'address' })
  user: User;

  @ManyToOne(() => Agent, (agent) => agent.portfolios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: Agent;

  @ManyToOne(() => AgentToken, (token) => token.portfolios, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'agentTokenId' })
  agentToken?: AgentToken;
}
