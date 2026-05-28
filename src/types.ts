/**
 * Shared Type Definitions for OfficerAI
 */

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AISummary {
  id: string;
  articleId: string;
  detailedBrief?: string;    // DETAILED INTELLIGENCE BRIEF (PRIMARY)
  prelimsFacts: string;      // QUICK PRELIMS FACTS
  whyMatters?: string;       // WHY THIS MATTERS FOR UPSC (CONCISE)
  oneLineRevision: string;   // ONE-LINE REVISION CORE
  officialSources?: string;  // OFFICIAL SOURCES
  visualConcept?: string;    // SUGGESTED INFOGRAPHIC/VISUAL METRIC
  // Backward compatibility fields
  whatHappened?: string;
  background?: string;
  whyImportant?: string;
  constitutionalLinks?: string;
  internationalRelevance?: string;
  mainsAnalysis?: string;
  wayForward?: string;
  pyqLinkage?: string;
}

export interface MCQ {
  id: string;
  articleId: string;
  articleTitle: string;
  question: string;
  options: string[]; // 4 options
  correctAnswer: number; // Index 0-3
  explanation: string;
  tags: string[];
}

export interface Article {
  id: string;
  title: string;
  source: string;
  sourcePriority: 'VERY HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  articleHash: string;
  ingestionTimestamp: string;
  relevanceScore: number; // 1 to 10
  category: string; // e.g. "Economy", "Environment", "International Relations", etc.
  tags: string[];
  content: string; // Cleaned article text
  readingTime: number; // in minutes
  sourceLink?: string; // Original URL link
  summary?: AISummary;
  mcq?: MCQ;
}

export interface IngestionLog {
  id: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
  message: string;
  articlesProcessed: number;
  articlesIngested: number;
}

export interface Source {
  id: string;
  name: string;
  type: 'POLICY' | 'INTERNATIONAL' | 'EDITORIAL';
  url: string;
  priority: 'VERY HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  isActive: boolean;
  uptimeRate?: number;
  successCount?: number;
  failureCount?: number;
  lastAttempt?: string;
  lastSuccess?: string;
  lastStatus?: string;
  reliabilityScore?: number;
}

export interface Bookmark {
  id: string;
  userId: string;
  articleId: string;
  savedAt: string;
}

export interface RevisionCard {
  id: string;
  userId: string;
  articleId: string;
  oneLineRevision: string;
  notes: string;
  isRevised: boolean;
  lastRevisedAt?: string;
  savedAt: string;
  category: string;
}
