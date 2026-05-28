import { Career, getCareerById } from './careers';
import { findCareerMatches } from './quiz';

export interface ComparisonResult {
  career: Career;
  matchPercentage: number;
  badge: 'overall' | 'entry' | 'growth' | 'match' | null;
  pros: string[];
  cons: string[];
  remotePotential: string;
  marketMomentum: string;
}

export interface CareerComparison {
  results: ComparisonResult[];
  sharedSkills: string[];
  tradeoffs: string[];
  decisionSummary: string;
  decisionStatus: 'explore' | 'strong' | 'standard';
  confidence: number;
}

export const COMPARISON_DIMENSIONS = [
  { label: 'AI Impact', key: 'aiImpact' },
  { label: 'Future Demand', key: 'futureDemand' },
  { label: 'Salary Trajectory', key: 'salary' },
  { label: 'Remote Potential', key: 'remote' },
  { label: 'Learning Difficulty', key: 'difficulty' },
  { label: 'Time to Entry', key: 'timeToJob' },
  { label: 'Market Momentum', key: 'momentum' },
  { label: 'Confidence Fit', key: 'confidence' },
];

function getRemotePotential(career: Career): string {
  const highRemoteCategories = ['Software Engineering', 'AI & Data', 'Design', 'Product & Management', 'Marketing', 'Content Creation'];
  return highRemoteCategories.includes(career.category) ? 'High' : 'Moderate';
}

function getMarketMomentum(career: Career): string {
  if (career.futureDemand === 'Exploding' || career.aiImpact === 'transformative') return 'Very High';
  if (career.futureDemand === 'High Growth' || career.aiImpact === 'high') return 'High';
  return 'Stable';
}

export function analyzeComparison(careerIds: string[], userTraits?: any): CareerComparison | null {
  const selectedCareers = careerIds.map(id => getCareerById(id)).filter(Boolean) as Career[];
  if (selectedCareers.length < 2) return null;

  // 1. Match against user traits
  const allMatches = userTraits ? findCareerMatches(userTraits, 150) : [];
  const results: ComparisonResult[] = selectedCareers.map(career => {
    const match = allMatches.find(m => m.careerId === career.id);
    const matchPercentage = match?.percentage ?? 0;

    // Derive Pros/Cons
    const pros = [];
    if (career.futureDemand === 'Exploding') pros.push('Exploding market demand');
    if (career.aiRelationship === 'AI-Augmented') pros.push('AI-resilient workflow');
    if (career.difficulty === 'low') pros.push('Quick mastery path');
    if (!pros.length) pros.push('Strong core skill leverage');

    const cons = [];
    if (career.difficulty === 'high') cons.push('Steep learning curve');
    if (career.aiRelationship === 'Automation-Heavy') cons.push('High automation exposure');
    if (career.futureDemand === 'Declining') cons.push('Softening market outlook');
    if (!cons.length) cons.push('Requires continuous skill updates');

    return {
      career,
      matchPercentage,
      badge: null,
      pros,
      cons,
      remotePotential: getRemotePotential(career),
      marketMomentum: getMarketMomentum(career)
    };
  });

  // 2. Assign Badges
  // Fastest entry
  const entryValues = selectedCareers.map(c => {
    const match = c.timeToJob?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 24;
  });
  const minEntry = Math.min(...entryValues);
  results[entryValues.indexOf(minEntry)].badge = 'entry';

  // Highest Growth
  const growthIdx = selectedCareers.findIndex(c => c.futureDemand === 'Exploding');
  if (growthIdx !== -1) results[growthIdx].badge = 'growth';

  // Best Match
  const bestMatchIdx = results.reduce((prev, curr, idx, self) => 
    curr.matchPercentage > self[prev].matchPercentage ? idx : prev, 0);
  if (userTraits && results[bestMatchIdx].matchPercentage > 0) {
    results[bestMatchIdx].badge = 'match';
  }

  // Best Overall (combined score)
  const overallIdx = results.reduce((prev, curr, idx, self) => {
    const score = (curr.matchPercentage * 0.4) + (curr.career.futureDemand === 'Exploding' ? 60 : 30);
    const prevScore = (self[prev].matchPercentage * 0.4) + (self[prev].career.futureDemand === 'Exploding' ? 60 : 30);
    return score > prevScore ? idx : prev;
  }, 0);
  results[overallIdx].badge = 'overall';

  // 3. Shared Skills
  const allTags = results.flatMap(r => r.career.tags || []);
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const sharedSkills = Object.entries(tagCounts)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
    .slice(0, 5);

  // 4. Tradeoffs
  const tradeoffs: string[] = [];
  if (results.length >= 2) {
    const r1 = results[0];
    const r2 = results[1];
    if (r1.career.difficulty !== r2.career.difficulty) {
      tradeoffs.push(`${r1.career.title} offers a ${r1.career.difficulty} learning path, while ${r2.career.title} is ${r2.career.difficulty}.`);
    }
    if (r1.career.timeToJob !== r2.career.timeToJob) {
      tradeoffs.push(`${r1.career.title} typically takes ${r1.career.timeToJob} to reach leverage, vs ${r2.career.title} at ${r2.career.timeToJob}.`);
    }
  }

  // 5. Decision Logic
  const avgConfidence = results.reduce((a, b) => a + b.matchPercentage, 0) / results.length;
  let decisionStatus: 'explore' | 'strong' | 'standard' = 'standard';
  let decisionSummary = '';

  if (avgConfidence < 40) {
    decisionStatus = 'explore';
    decisionSummary = 'Your current profile shows low overlap with these specific paths. We recommend exploring adjacent categories or retaking the quiz to refine your signals.';
  } else if (avgConfidence > 70) {
    decisionStatus = 'strong';
    const best = results.find(r => r.badge === 'match' || r.badge === 'overall');
    decisionSummary = `We have a strong recommendation for ${best?.career.title}. It maps exceptionally well to your thinking style and market momentum.`;
  } else {
    decisionStatus = 'standard';
    decisionSummary = 'These paths are all viable. Focus on the tradeoffs between entry speed and long-term growth potential to make your final choice.';
  }

  return {
    results,
    sharedSkills,
    tradeoffs,
    decisionSummary,
    decisionStatus,
    confidence: Math.round(avgConfidence)
  };
}

export const BADGE_LABELS = {
  overall: 'Best overall',
  entry: 'Fastest entry',
  growth: 'Highest growth',
  match: 'Best match for you'
};