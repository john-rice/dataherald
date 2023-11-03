import { ClassValue } from 'clsx'
import { LucideIcon } from 'lucide-react'

export enum EDomainQueryStatus {
  REJECTED = 'REJECTED',
  SQL_ERROR = 'SQL_ERROR',
  NOT_VERIFIED = 'NOT_VERIFIED',
  LOW_CONFIDENCE = 'LOW_CONFIDENCE',
  MEDIUM_CONFIDENCE = 'MEDIUM_CONFIDENCE',
  HIGH_CONFIDENCE = 'HIGH_CONFIDENCE',
  VERIFIED = 'VERIFIED',
}

export type DomainQueryStatus = keyof typeof EDomainQueryStatus

export enum EDomainQueryWorkspaceStatus {
  VERIFIED = 'VERIFIED',
  NOT_VERIFIED = 'NOT_VERIFIED',
  REJECTED = 'REJECTED',
}

export type QueryWorkspaceStatus = keyof typeof EDomainQueryWorkspaceStatus

export type ColorClasses = {
  text?: string
  border?: string
  background?: string
}

export type ResourceColors<T extends string> = Record<T, ColorClasses>

export type ResourceButtonClasses<K extends string> = Record<K, ClassValue>

export type DatabaseResourceType = 'database' | 'table' | 'column'

interface DatabaseResourceBase {
  id: string
  type: DatabaseResourceType
  icon: LucideIcon
  name: string
}

export interface DatabaseResource extends DatabaseResourceBase {
  instructions: string
}

export interface TableResource extends DatabaseResourceBase {
  description: string
}

export interface ColumnResource extends TableResource {
  categories?: string[]
}
