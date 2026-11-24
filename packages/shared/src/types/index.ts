export type SupportedSite = 'leetcode' | 'gfg' | 'hackerrank';

export type HintLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type StudentLevel = 'beginner' | 'intermediate' | 'interview_prep';

export type BuddyGender = 'male' | 'female';

export type BuddyPersona = 
  | 'cheerleader'  // High encouragement, warm, celebratory
  | 'mentor'       // Socratic, thought-provoking, measured
  | 'zen_master'   // Calm, perspective-giving, anti-stress
  | 'strict_coach';// Direct, precise, focused on constraints and complexity

export type BuddyEmotion = 'idle' | 'thinking' | 'cheering' | 'concerned';

export interface BuddyConfig {
  gender: BuddyGender;
  name: string;
  avatarStyleId: string;       // 1, 2, or 3
  outfitId: string;            // 'tan_classic', 'tech_hoodie', etc.
  accentColor: string;         // e.g. '#3E7B5C'
  persona: BuddyPersona;
  voiceEnabled: boolean;
  language: 'en' | 'hi' | 'ta';// English, Hindi, Tamil
  autoStuckNudge: boolean;
  cooldownSeconds: number;
}

export interface ProblemContext {
  canonicalId: string;         // e.g. "lc:two-sum", "gfg:reverse-array"
  site: SupportedSite;
  slug: string;
  title: string;
  statement: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  tags?: string[];
  constraints?: string[];
}

export interface CodeContext {
  language: string;
  code: string;
  version: number;
  lastChangedAt: number;
}

export interface SubmissionResult {
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compile Error';
  failedCase?: string;
  runtime?: string;
  memory?: string;
  timestamp: number;
}

export interface PlatformAdapter {
  site: SupportedSite;
  matches(url: string): boolean;
  getProblem(): Promise<ProblemContext | null>;
  getUserCode(): Promise<CodeContext>;
  onSubmissionResult(callback: (result: SubmissionResult) => void): () => void;
  mountPoint(): HTMLElement;
}

export interface HintRequest {
  problemId: string;
  level: HintLevel;
  userCode?: string;
  language?: string;
  studentLevel: StudentLevel;
  personality: BuddyPersona;
  locale?: 'en' | 'hi' | 'ta';
  isRephrase?: boolean;        // If user pressed "I'm still stuck on this"
  confirmLastResort?: boolean; // Required to unlock level 5
}

export interface AlternativeSolution {
  title: string;
  technique: string;
  timeComplexity: string;
  spaceComplexity: string;
  tradeOff: string;
  codeSnippet: string;
}

export interface SimilarProblem {
  title: string;
  site: SupportedSite;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  url: string;
  patternReason: string;
}

export interface GamificationStats {
  streakDays: number;
  totalSolved: number;
  solvedByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  patternMastery: Record<string, number>;
  unlockedBadges: string[];
}

export interface CheckpointOption {
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface InteractiveCheckpoint {
  question: string;
  options: CheckpointOption[];
}

export interface DiagramStep {
  label: string;
  diagram: string;
  explanation: string;
}

export interface LineBreakdown {
  line: string;
  explanation: string;
}

export interface ComplexityNote {
  time: string;
  space: string;
  rationale: string;
}

export interface HintResponse {
  problemId: string;
  level: HintLevel;
  levelName: string;
  hintText: string;
  analogy?: string;
  simplerAngle?: string;
  bottleneckTakeaway?: string;
  cooldownSeconds: number;
  xpRewardPotential: number;
  cached: boolean;
  alternativeSolutions?: AlternativeSolution[];
  similarProblems?: SimilarProblem[];
  edgeCases?: string[];
  checkpoint?: InteractiveCheckpoint;
  diagrams?: DiagramStep[];
  lineBreakdowns?: LineBreakdown[];
  complexityNote?: ComplexityNote;
  fullCode?: string;
}

export interface StuckSignal {
  idleSeconds: number;
  consecutiveFailures: number;
  lastFailureStatus?: string;
  codeChurnRatio: number;
  solutionsTabInteractions: number;
  stuckScore: number;          // 0 to 100
}

export interface StuckDiagnosis {
  category: 
    | 'off_by_one'
    | 'missing_edge_case'
    | 'wrong_data_structure'
    | 'time_limit_exceeded'
    | 'integer_overflow'
    | 'state_not_reset'
    | 'syntax_or_type';
  nudgeMessage: string;
  guidingQuestion: string;
}

export interface AttemptRecord {
  id: string;
  userId: string;
  problemId: string;
  startedAt: string;
  solvedAt?: string;
  maxHintLevel: HintLevel;
  submissionCount: number;
  xpEarned: number;
  status: 'in_progress' | 'solved' | 'abandoned';
}

export interface MistakeEntry {
  id: string;
  userId: string;
  problemId: string;
  problemTitle: string;
  stumblingBlock: string;
  keyTakeaway: string;
  createdAt: string;
}

export interface RevisionItem {
  id: string;
  userId: string;
  problemId: string;
  problemTitle: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  dueDate: string;
  intervalStep: 1 | 2 | 3;     // 3 days, 7 days, 21 days
  completed: boolean;
}
