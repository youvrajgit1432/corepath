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

// ============ Career Matching & Recommendations ============
export type { CareerMatch, RecommendationResult, CareerComparison } from "./career-matching";
export { getCareerRecommendations, searchCareers, getCareersByDomain, getCareerById as getCareerByIdFromMatching, getCareersByDifficulty, getCareersByDemand, compareCarees, getCareerPath, getCareersWithSkill, getAvailableDomains, getAvailableSkills } from "./career-matching";

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
