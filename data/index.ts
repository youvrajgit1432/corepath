/**
 * DATA LAYER EXPORTS
 * Central point for importing all career data and quiz logic
 * Integrated system with 95+ careers
 */

// ============ Career Data ============
export type { Career, AIImpactLevel } from "./careers";
export { aiImpactLabels, aiImpactColors, careers, getCareerById } from "./careers";

// ============ Quiz System ============
export type { QuizQuestion, QuizOption, ScoreResult, TraitScores } from "./quiz";
export { quizQuestions, calculateResults, calculateTraitScores, findCareerMatches, normalizeTraitScores, traitDimensions, calculateCosineSimilarity } from "./quiz";
export { calculateEnhancedProfile } from "./quiz-enhanced";
export { generateResultReport } from "./quiz-report";
export type { ResultReport } from "./quiz-report";

// ============ Career Matching & Recommendations ============
export type { CareerMatch, RecommendationResult, CareerComparison } from "./career-matching";
export { getCareerRecommendations, searchCareers, getCareersByDomain, getCareerById as getCareerByIdFromMatching, getCareersByDifficulty, getCareersByDemand, compareCarees, getCareerPath, getCareersWithSkill, getAvailableDomains, getAvailableSkills } from "./career-matching";
export { loadJourneyMemory, recordJourneyEvent, buildJourneyProfile, type JourneyEvent } from "./journey-memory";
export { buildConfidenceInsights, type ConfidenceInsights } from "./confidence-engine";
export { buildCareerEvolution } from "./career-evolution";

// ============ Skill Gap Intelligence ============
export type { SkillGapResult } from "./skill-gap";
export { analyzeSkillGap, getCareerReadiness, getNextLearningPriority } from "./skill-gap";

// ============ Project Recommendations ============
export type { Project, ProjectRecommendations, ExperienceLevel, AIRelevance } from "./project-recommendations";
export { generateProjectRecommendations, getProjectsForCareer } from "./project-recommendations";

// ============ Career Execution Workspace ============
export type { CareerWorkspace, ProgressEntry } from "./career-workspace";
export {
  loadCareerWorkspace,
  selectCareer,
  recordMilestoneCompletion,
  recordProjectCompletion,
  recordStudySession,
  advancePhase,
  calculateReadiness,
  getNextRecommendedAction,
  getWeeklyProgress,
  getStreakInfo,
} from "./career-workspace";

/**
 * QUICK START GUIDE
 *
 * 1. Get quiz questions:
 *    import { quizQuestions } from '@/data'
 *    quizQuestions.map(q => ({ id: q.id, question: q.question }))
 *
 * 2. Calculate user traits from quiz answers:
 *    import { calculateTraits } from '@/data'
 *    const traits = calculateTraits(userAnswers)
 *
 * 3. Get career recommendations:
 *    import { getCareerRecommendations } from '@/data'
 *    const results = getCareerRecommendations(traits, 5)
 *    results.topMatches.forEach(match => console.log(match.career.title))
 *
 * 4. Search careers:
 *    import { searchCareers } from '@/data'
 *    searchCareers('machine learning')
 *
 * 5. Get all domains:
 *    import { getAvailableDomains } from '@/data'
 *    const domains = getAvailableDomains()
 */
