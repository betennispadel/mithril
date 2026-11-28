import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';

export type PhishingTemplateType = 'email' | 'landing';

@Entity('phishing_templates')
@Index('IDX_phishing_templates_workspace', ['workspaceId'])
@Index('IDX_phishing_templates_workspace_type', ['workspaceId', 'type'])
export class PhishingTemplate extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  workspaceId: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty({ description: 'email or landing' })
  @Column({ type: 'varchar', default: 'email' })
  type: PhishingTemplateType;

  @ApiProperty({ nullable: true, description: 'Email subject (email type only)' })
  @Column({ nullable: true })
  subject: string;

  @ApiProperty({ description: 'HTML content' })
  @Column({ type: 'text' })
  html: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ nullable: true, description: 'Preset this was cloned from' })
  @Column({ nullable: true })
  clonedFrom: string;

  @ApiProperty({ default: false })
  @Column({ default: false })
  isDefault: boolean;
}
