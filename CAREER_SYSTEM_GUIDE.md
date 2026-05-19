# Career Recommendation System - Integration Guide

## System Overview

This system provides a complete career matching engine built on:
- **95+ Career Database** (careers.json) - Comprehensive IT career paths across 12 domains
- **Trait-Based Quiz** (quiz-new.ts) - 10 questions scoring 8 personality/skill dimensions
- **Cosine Similarity Matching** (career-matching.ts) - Advanced recommendation algorithm

## Architecture

```
Data Layer
├── careers.json                    # 95+ career objects with metadata
├── quiz-new.ts                     # 10-question trait-based quiz
├── career-matching.ts              # Cosine similarity & matching logic
└── index.ts                        # Central exports
```

## 8 Trait Dimensions

1. **Creativity** - Innovation, out-of-the-box thinking, artistic ability
2. **Analytical** - Data-driven, logical reasoning, problem decomposition
3. **Leadership** - Team direction, decision-making, influence
4. **Technical-Depth** - Deep expertise, specialization, mastery
5. **Social** - Communication, collaboration, empathy
6. **Structure** - Organization, process orientation, planning
7. **Risk-Tolerance** - Comfort with uncertainty, entrepreneurial mindset
8. **Visual** - Design thinking, spatial reasoning, aesthetics

## Career Data Structure

Each career object contains:
```typescript
{
  id: string;                              // Unique identifier
  title: string;                           // Career title
  domain: string;                          // One of 12 domains
  difficulty: "low" | "moderate" | "high" | "transformative";
  timeToJob: string;                       // "X-Y months"
  coreSkill: string;                       // Primary skill needed
  demand: "low" | "moderate" | "high";     // Market demand
  salary: string;                          // Salary range
  tags: string[];                          // Skill tags
  quiz_traits: string[];                   // Mapped trait dimensions
}
```

## 12 Career Domains

1. **Software Engineering** (12 paths) - Backend, Frontend, Full Stack, Mobile, Game Dev, Embedded, etc.
2. **Data & AI** (13 paths) - Data Engineer, ML Engineer, NLP, Computer Vision, etc.
3. **Infrastructure & Ops** (11 paths) - DevOps, SRE, Cloud Architect, Kubernetes, etc.
4. **Security** (12 paths) - Security Engineer, Penetration Tester, Cloud Security, etc.
5. **Design & UX** (10 paths) - UX Designer, UI Designer, Product Designer, etc.
6. **Product & Management** (10 paths) - Product Manager, Engineering Manager, CTO, etc.
7. **Networking** (8 paths) - Network Engineer, Network Architect, SDN Engineer, etc.
8. **Support & QA** (8 paths) - QA Engineer, SDET, Technical Support, etc.
9. **Emerging Tech** (8 paths) - Blockchain, AR/VR, Robotics, Quantum, etc.
10. **Business & IT** (10 paths) - IT Consultant, Business Analyst, ERP Specialist, etc.
11. **Digital Marketing** (14 paths) - SEO, SEM, Content Strategist, Growth Hacker, etc.
12. **Content Creation** (14 paths) - Content Writer, Video Creator, Podcast Producer, etc.

## Usage Examples

### Basic Quiz Flow
```typescript
import { quizQuestions, calculateTraitScores, normalizeScores } from '@/data'

// 1. Display quiz questions
quizQuestions.forEach(q => console.log(q.question))

// 2. Collect answers
const userAnswers = ['q1a', 'q2c', 'q3b', 'q4d', 'q5a', 'q6b', 'q7c', 'q8d', 'q9a', 'q10b']

// 3. Calculate trait scores
const rawScores = calculateTraitScores(userAnswers)
const normalizedScores = normalizeScores(rawScores)

// Result:
// {
//   creativity: 0.75,
//   analytical: 0.5,
//   leadership: 0.25,
//   technical-depth: 1.0,
//   social: 0.33,
//   structure: 0.5,
//   risk-tolerance: 0.4,
//   visual: 0.6
// }
```

### Finding Top Career Matches
```typescript
import { findCareerMatches, allCareers } from '@/data'

// Get top 5 career matches
const topMatches = findCareerMatches(normalizedScores, allCareers, 5)

topMatches.forEach(match => {
  console.log(`${match.career.title} - Match: ${(match.similarityScore * 100).toFixed(0)}%`)
  console.log('Why:', match.matchReasons.join(', '))
})

// Example output:
// Backend Engineer - Match: 92%
// Why: Your deep technical expertise aligns with this role's core focus, Specialized role requiring dedicated learning (6-12 months)
//
// Full Stack Engineer - Match: 88%
// Why: Your deep technical expertise aligns with this role's core focus, Specialized role requiring dedicated learning (12-18 months)
```

### Filtering & Grouping
```typescript
import { filterCareers, getCareersGroupedByDomain } from '@/data'

// Filter by domain
const softwareEngineeringCareers = filterCareers(allCareers, "Software Engineering")

// Filter by difficulty
const modestCareers = filterCareers(allCareers, undefined, "moderate")

// Group matches by domain
const grouped = getCareersGroupedByDomain(topMatches)
// Result: { "Software Engineering": [...], "Data & AI": [...] }
```

### Detailed Career Profile
```typescript
import { getDetailedCareerProfile } from '@/data'

const career = allCareers.find(c => c.id === 'backend-engineer')
const profile = getDetailedCareerProfile(career, normalizedScores)

console.log(profile)
// {
//   ...career,
//   matchScore: 92,
//   userAlignedTraits: ['analytical', 'technical-depth', 'structure'],
//   topUserTraits: ['technical-depth', 'analytical', 'structure']
// }
```

## React Component Integration

### Example: Quiz Component
```typescript
import { useState } from 'react'
import { quizQuestions, calculateTraitScores, normalizeScores } from '@/data'

export function QuizComponent() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])

  const handleAnswer = (optionId: string) => {
    const newAnswers = [...answers, optionId]
    setAnswers(newAnswers)

    if (newAnswers.length === quizQuestions.length) {
      // Quiz complete - calculate scores
      const scores = normalizeScores(calculateTraitScores(newAnswers))
      onComplete(scores)
    } else {
      setCurrentQuestion(current => current + 1)
    }
  }

  const question = quizQuestions[currentQuestion]

  return (
    <div>
      <h2>{question.question}</h2>
      {question.hint && <p className="text-gray-500">{question.hint}</p>}
      {question.options.map(option => (
        <button
          key={option.id}
          onClick={() => handleAnswer(option.id)}
          className="block w-full text-left p-4 border rounded mb-2"
        >
          {option.label}
        </button>
      ))}
      <p className="text-sm">
        Question {currentQuestion + 1} of {quizQuestions.length}
      </p>
    </div>
  )
}
```

### Example: Results Component
```typescript
import { findCareerMatches, allCareers, type TraitScores } from '@/data'

export function ResultsComponent({ scores }: { scores: TraitScores }) {
  const matches = findCareerMatches(scores, allCareers, 5)

  return (
    <div>
      <h2>Your Top Career Matches</h2>
      {matches.map((match, index) => (
        <div key={match.career.id} className="p-4 border rounded mb-4">
          <h3>
            {index + 1}. {match.career.title}
          </h3>
          <p className="font-bold">
            Match: {(match.similarityScore * 100).toFixed(0)}%
          </p>
          <div className="mt-2">
            <h4 className="font-semibold">Why this matches:</h4>
            <ul>
              {match.matchReasons.map((reason, i) => (
                <li key={i} className="text-sm">• {reason}</li>
              ))}
            </ul>
          </div>
          <div className="mt-2 text-sm">
            <p><strong>Core Skill:</strong> {match.career.coreSkill}</p>
            <p><strong>Time to Job:</strong> {match.career.timeToJob}</p>
            <p><strong>Demand:</strong> {match.career.demand}</p>
            <p><strong>Salary:</strong> {match.career.salary}</p>
          </div>
          <div className="mt-2">
            <strong>Tags:</strong>
            <div className="flex gap-2 flex-wrap mt-1">
              {match.career.tags.map(tag => (
                <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

## Algorithm Details

### Cosine Similarity Formula
```
similarity = (A · B) / (||A|| * ||B||)

Where:
- A = User's normalized trait scores
- B = Career's trait weights
- A · B = Dot product of vectors
- ||A|| = Magnitude of user vector
- ||B|| = Magnitude of career vector

Result: 0 (no match) to 1 (perfect match)
```

### Trait Scoring
1. Each quiz answer contributes to specific traits
2. All trait contributions are summed
3. Scores are normalized by dividing by maximum score
4. Normalized scores range from 0 to 1

### Career Matching
1. Each career has weighted traits (equal weight for all its traits)
2. Cosine similarity calculated between user traits and career traits
3. Careers sorted by similarity score (highest first)
4. Top N careers returned with match reasons

## Performance Considerations

- **Quiz**: O(1) - Fixed 10 questions
- **Matching**: O(n) where n = number of careers (~95)
- **Filtering**: O(n) worst case
- **Grouping**: O(n) worst case

All operations complete in <100ms for typical use cases.

## Future Enhancements

- [ ] Machine learning-based recommendations
- [ ] User feedback loop to improve matching
- [ ] Career progression recommendations
- [ ] Skills gap analysis
- [ ] Salary negotiation guides
- [ ] Interview preparation resources
- [ ] Networking suggestions based on profile
- [ ] Real-time job availability integration

## File Locations

```
/data/
├── careers.json                    # 95+ careers (JSON data)
├── quiz-new.ts                     # Quiz engine
├── career-matching.ts              # Matching algorithm
└── index.ts                        # Public exports
```

## Troubleshooting

**Q: All scores are the same?**
A: Ensure you're normalizing scores with `normalizeScores()` after calculating.

**Q: Matches seem random?**
A: Check that `quiz_traits` array is properly populated for each career.

**Q: Performance issues?**
A: Consider memoizing `findCareerMatches()` if called frequently in React.

## Support & Updates

For issues or to add new careers/traits:
1. Update careers.json with new career data
2. Add corresponding quiz options if new traits needed
3. Test with `calculateTraitScores()` to verify trait mapping
4. Run matching algorithm against sample scores
