import { Career, careers, getCareerById, getCareerReality } from "./careers";
import { compareCareers } from "./career-comparison";

export type InsightPageType = "comparison" | "future" | "psychology" | "learning";

export interface SeoInsightPage {
  slug: string;
  title: string;
  description: string;
  category: string;
  pageType: InsightPageType;
  keywords: string[];
  compareIds?: [string, string];
  filter?: (career: Career) => boolean;
  spotlightCareerIds?: string[];
  relatedInsights?: string[];
}

const insightPages: SeoInsightPage[] = [
  {
    slug: "backend-vs-devops",
    title: "Backend Engineer vs DevOps Engineer",
    description:
      "Compare backend engineering and DevOps engineering on systems focus, AI impact, and long-term specialization.",
    category: "Career comparisons",
    pageType: "comparison",
    keywords: ["backend vs devops", "backend engineer", "devops engineer"],
    compareIds: ["backend-engineer", "devops-engineer"],
    relatedInsights: ["future-proof-tech-careers", "skills-needed-for-devops"],
  },
  {
    slug: "ai-engineer-vs-data-scientist",
    title: "AI Engineer vs Data Scientist",
    description:
      "Compare data science and AI engineering paths so you can choose the role with the right mix of modeling, systems, and business impact.",
    category: "Career comparisons",
    pageType: "comparison",
    keywords: ["ai engineer vs data scientist", "data scientist", "machine learning engineer"],
    compareIds: ["ml-engineer", "data-scientist"],
    relatedInsights: ["roadmap-to-ai-engineer", "career-transition-guides"],
  },
  {
    slug: "cybersecurity-vs-ai",
    title: "Cybersecurity Analyst vs AI Engineer",
    description:
      "Explore how cybersecurity and AI engineering differ in risk, impact, and the kind of systems you will build.",
    category: "Career comparisons",
    pageType: "comparison",
    keywords: ["cybersecurity vs ai", "cybersecurity analyst", "ai engineer"],
    compareIds: ["cybersecurity-analyst", "ml-engineer"],
    relatedInsights: ["careers-safe-from-ai", "future-proof-tech-careers"],
  },
  {
    slug: "frontend-vs-ui-ux",
    title: "Frontend Engineer vs UI/UX Designer",
    description:
      "Compare frontend engineering and UI/UX design so you can choose the best fit for technical creativity and product experience work.",
    category: "Career comparisons",
    pageType: "comparison",
    keywords: ["frontend vs ui ux", "frontend engineer", "ui ux designer"],
    compareIds: ["frontend-engineer", "ui-designer"],
    relatedInsights: ["best-careers-for-creative-problem-solvers", "career-transition-guides"],
  },
  {
    slug: "future-proof-tech-careers",
    title: "Future-Proof Tech Careers",
    description:
      "Discover the careers best positioned for lasting demand, AI resilience, and sustainable specialization.",
    category: "Future-focused",
    pageType: "future",
    keywords: ["future proof tech careers", "tech careers safe from ai", "future jobs"],
    filter: (career) =>
      career.futureDemand === "Exploding" ||
      career.aiImpact === "transformative" ||
      career.aiRelationship === "AI-Created",
    relatedInsights: ["careers-safe-from-ai", "fast-growing-ai-careers"],
  },
  {
    slug: "careers-safe-from-ai",
    title: "Careers Safe from AI",
    description:
      "Learn which tech roles are less exposed to automation and where human judgment remains the strongest advantage.",
    category: "Future-focused",
    pageType: "future",
    keywords: ["careers safe from ai", "roles not replaced by ai", "human centered careers"],
    filter: (career) =>
      career.aiImpact !== "high" && career.aiImpact !== "transformative" &&
      career.aiRelationship !== "AI-Created",
    relatedInsights: ["future-proof-tech-careers", "best-careers-for-systems-thinkers"],
  },
  {
    slug: "fast-growing-ai-careers",
    title: "Fast-Growing AI Careers",
    description:
      "Find the AI-native and high-growth roles that are expanding quickly and worth prioritizing in your learning path.",
    category: "Future-focused",
    pageType: "future",
    keywords: ["fast growing ai careers", "high growth ai jobs", "ai native jobs"],
    filter: (career) =>
      career.futureDemand === "Exploding" ||
      career.aiImpact === "high" ||
      career.aiImpact === "transformative",
    relatedInsights: ["ai-native-jobs", "future-proof-tech-careers"],
  },
  {
    slug: "ai-native-jobs",
    title: "AI-Native Jobs",
    description:
      "Explore roles that are built around AI as a core function rather than AI as a tool.",
    category: "Future-focused",
    pageType: "future",
    keywords: ["ai native jobs", "ai first careers", "transformative ai roles"],
    filter: (career) =>
      career.aiRelationship === "AI-Created" || career.aiImpact === "transformative",
    relatedInsights: ["fast-growing-ai-careers", "future-proof-tech-careers"],
  },
  {
    slug: "best-careers-for-analytical-thinkers",
    title: "Best Careers for Analytical Thinkers",
    description:
      "See which roles reward systems thinking, logic, and technical depth in the AI era.",
    category: "Psychology-based",
    pageType: "psychology",
    keywords: ["analytical thinkers careers", "best careers for analytical minds", "systems thinking jobs"],
    filter: (career) => career.quiz_traits?.includes("analytical") ?? false,
    relatedInsights: ["best-careers-for-systems-thinkers", "career-transition-guides"],
  },
  {
    slug: "careers-for-introverts-in-tech",
    title: "Careers for Introverts in Tech",
    description:
      "Identify tech roles that emphasize individual problem solving over high-touch collaboration.",
    category: "Psychology-based",
    pageType: "psychology",
    keywords: ["introvert careers tech", "tech jobs for introverts", "quiet tech careers"],
    filter: (career) => !(career.quiz_traits?.includes("social") ?? false),
    relatedInsights: ["best-careers-for-analytical-thinkers", "careers-safe-from-ai"],
  },
  {
    slug: "careers-for-creative-problem-solvers",
    title: "Careers for Creative Problem Solvers",
    description:
      "Explore roles that combine creative thinking with practical technical delivery.",
    category: "Psychology-based",
    pageType: "psychology",
    keywords: ["creative problem solver careers", "creative tech roles", "innovative career paths"],
    filter: (career) =>
      (career.quiz_traits?.includes("creativity") ?? false) ||
      (career.quiz_traits?.includes("visual") ?? false),
    relatedInsights: ["frontend-vs-ui-ux", "fast-growing-ai-careers"],
  },
  {
    slug: "best-careers-for-systems-thinkers",
    title: "Best Careers for Systems Thinkers",
    description:
      "Find the roles that reward structured systems work, architecture thinking, and operational clarity.",
    category: "Psychology-based",
    pageType: "psychology",
    keywords: ["systems thinker careers", "role for systems thinkers", "architecture jobs"],
    filter: (career) =>
      (career.quiz_traits?.includes("structure") ?? false) ||
      (career.quiz_traits?.includes("technical-depth") ?? false) ||
      (career.quiz_traits?.includes("analytical") ?? false),
    relatedInsights: ["backend-vs-devops", "future-proof-tech-careers"],
  },
  {
    slug: "how-to-become-backend-engineer",
    title: "How to Become a Backend Engineer",
    description:
      "A practical learning path that connects backend fundamentals, system design, and real-world APIs.",
    category: "Learning",
    pageType: "learning",
    keywords: ["how to become backend engineer", "backend engineer roadmap", "backend developer skills"],
    spotlightCareerIds: ["backend-engineer"],
    relatedInsights: ["backend-vs-devops", "skills-needed-for-devops"],
  },
  {
    slug: "roadmap-to-ai-engineer",
    title: "Roadmap to AI Engineer",
    description:
      "A career roadmap for AI engineers that balances model building, deployment, and real-world impact.",
    category: "Learning",
    pageType: "learning",
    keywords: ["roadmap to ai engineer", "ai engineer career path", "ai engineering skills"],
    spotlightCareerIds: ["ml-engineer"],
    relatedInsights: ["ai-engineer-vs-data-scientist", "fast-growing-ai-careers"],
  },
  {
    slug: "skills-needed-for-devops",
    title: "Skills Needed for DevOps",
    description:
      "Understand the core skills and tools that make a DevOps engineer effective in production environments.",
    category: "Learning",
    pageType: "learning",
    keywords: ["skills needed for devops", "devops engineer skills", "devops learning path"],
    spotlightCareerIds: ["devops-engineer"],
    relatedInsights: ["backend-vs-devops", "career-transition-guides"],
  },
  {
    slug: "career-transition-guides",
    title: "Career Transition Guides",
    description:
      "Learn which adjacent roles are the most natural transition targets and how to pivot with clarity.",
    category: "Learning",
    pageType: "learning",
    keywords: ["career transition guides", "tech career pivot", "change careers into tech"],
    filter: (career) =>
      career.futureDemand === "Exploding" || career.futureDemand === "High Growth",
    spotlightCareerIds: ["ml-engineer", "data-scientist", "frontend-engineer", "cloud-architect"],
    relatedInsights: ["ai-engineer-vs-data-scientist", "best-careers-for-analytical-thinkers"],
  },
];

export function getInsightPages() {
  return insightPages;
}

export function getInsightPage(slug: string) {
  return insightPages.find((page) => page.slug === slug);
}

export function getInsightUrl(slug: string) {
  return `/insights/${slug}`;
}

function resolveCareers(page: SeoInsightPage) {
  if (page.compareIds) {
    return page.compareIds
      .map(getCareerById)
      .filter((career): career is Career => Boolean(career));
  }
  const spotlight = page.spotlightCareerIds?.map(getCareerById).filter((career): career is Career => Boolean(career)) ?? [];
  if (spotlight.length) {
    return spotlight;
  }
  if (page.filter) {
    return careers.filter(page.filter);
  }
  return careers.slice(0, 4);
}

function uniqueCareers(careerList: Career[]) {
  const seen = new Set<string>();
  return careerList.filter((career) => {
    if (seen.has(career.id)) return false;
    seen.add(career.id);
    return true;
  });
}

function rankCareerForInsight(career: Career) {
  const impactScore = career.aiImpact === "transformative" ? 3 : career.aiImpact === "high" ? 2 : 1;
  const demandScore = career.futureDemand === "Exploding" ? 3 : career.futureDemand === "High Growth" ? 2 : 1;
  const beginnerScore = career.difficulty === "low" ? 2 : career.difficulty === "moderate" ? 1 : 0;
  return impactScore * 3 + demandScore * 2 + beginnerScore;
}

function pickTopCareers(page: SeoInsightPage, count = 4) {
  const resolved = uniqueCareers(resolveCareers(page));
  return resolved.sort((a, b) => rankCareerForInsight(b) - rankCareerForInsight(a)).slice(0, count);
}

function buildTagFocus(career: Career) {
  const tags = career.tags ?? [];
  if (tags.some((tag) => /api|database|scalability|performance/i.test(tag))) {
    return "application architecture and backend systems";
  }
  if (tags.some((tag) => /mlops|monitoring|automation|deployment/i.test(tag))) {
    return "production AI systems and operational reliability";
  }
  if (tags.some((tag) => /data|synthetic|model|analytics/i.test(tag))) {
    return "data pipelines, model reliability, and real-world insights";
  }
  if (tags.some((tag) => /ux|design|visual|interface/i.test(tag))) {
    return "user experience, design systems, and polished interfaces";
  }
  if (tags.some((tag) => /policy|ethics|governance/i.test(tag))) {
    return "governance, risk, and responsible AI systems";
  }
  return career.coreSkill ? career.coreSkill.toLowerCase() : "its core domain";
}

function buildCareerCollectionSummary(careersToDescribe: Career[]) {
  const uniqueSkills = Array.from(
    new Set(careersToDescribe.flatMap((career) => [career.coreSkill, ...(career.supportingSkills ?? [])]))
  ).slice(0, 6);

  const relevantBuckets = {
    transformative: careersToDescribe.filter((career) => career.aiImpact === "transformative").length,
    high: careersToDescribe.filter((career) => career.aiImpact === "high").length,
    moderate: careersToDescribe.filter((career) => career.aiImpact === "moderate").length,
    low: careersToDescribe.filter((career) => career.aiImpact === "low").length,
  };

  return {
    skills: uniqueSkills,
    aiCounts: relevantBuckets,
    difficultyCounts: {
      high: careersToDescribe.filter((career) => career.difficulty === "high").length,
      moderate: careersToDescribe.filter((career) => career.difficulty === "moderate").length,
      low: careersToDescribe.filter((career) => career.difficulty === "low").length,
    },
    futureCounts: {
      exploding: careersToDescribe.filter((career) => career.futureDemand === "Exploding").length,
      highGrowth: careersToDescribe.filter((career) => career.futureDemand === "High Growth").length,
      stable: careersToDescribe.filter((career) => career.futureDemand === "Stable").length,
    },
  };
}

function humanizeList(items: string[]) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

export interface InsightContent {
  overview: string;
  keyDifferences: string[];
  aiImpact: string;
  skills: string;
  difficulty: string;
  futureOutlook: string;
  recommendationSummary: string;
  relatedCareers: Career[];
  faqs: Array<{ question: string; answer: string }>;
  relatedInsights: Array<{ title: string; href: string }>;
}

export function buildInsightContent(page: SeoInsightPage): InsightContent {
  const relevantCareers = uniqueCareers(resolveCareers(page));
  const topCareers = pickTopCareers(page, 4);
  const summary = buildCareerCollectionSummary(relevantCareers);
  const relatedInsights = (page.relatedInsights ?? [])
    .map((slug) => getInsightPage(slug))
    .filter((item): item is SeoInsightPage => Boolean(item))
    .map((item) => ({ title: item.title, href: getInsightUrl(item.slug) }));

  const overview = page.pageType === "comparison"
    ? (() => {
        const [left, right] = relevantCareers;
        if (!left || !right) {
          return page.description;
        }
        return `This comparison contrasts ${left.title} and ${right.title} so you can see the practical differences in role focus, AI impact, and where each path leads.`;
      })()
    : page.description;

  const keyDifferences = page.pageType === "comparison" && relevantCareers.length === 2
    ? compareCareers(relevantCareers[0], relevantCareers[1]).differences.careerA.map((item) => item)
    : relevantCareers.slice(0, 4).map((career) => `${career.title} is centered on ${buildTagFocus(career)}.`);

  const aiImpact = page.pageType === "comparison" && relevantCareers.length === 2
    ? compareCareers(relevantCareers[0], relevantCareers[1]).aiEraDifferences.join(" ")
    : (() => {
        const segments: string[] = [];
        if (summary.aiCounts.transformative) {
          segments.push(`${summary.aiCounts.transformative} roles are rated transformative AI impact`);
        }
        if (summary.aiCounts.high) {
          segments.push(`${summary.aiCounts.high} roles have high AI impact`);
        }
        if (!segments.length) {
          segments.push(`This group is shaped by AI augmentation, with a mix of stable and growing roles.`);
        }
        return `The AI impact in this collection is balanced: ${humanizeList(segments)}.`;
      })();

  const skills = (() => {
    const skillList = summary.skills.slice(0, 6);
    return `Core skills include ${humanizeList(skillList)}. These are the capabilities that matter most for the careers featured on this page.`;
  })();

  const difficulty = (() => {
    const { high, moderate, low } = summary.difficultyCounts;
    const pieces: string[] = [];
    if (high) pieces.push(`${high} high difficulty role${high === 1 ? "" : "s"}`);
    if (moderate) pieces.push(`${moderate} moderate difficulty role${moderate === 1 ? "" : "s"}`);
    if (low) pieces.push(`${low} beginner-friendly role${low === 1 ? "" : "s"}`);
    return `Among the careers here, there are ${humanizeList(pieces)}. Choose based on how fast you want to level up versus how much depth you want to build.`;
  })();

  const futureOutlook = (() => {
    const { exploding, highGrowth, stable } = summary.futureCounts;
    const parts: string[] = [];
    if (exploding) parts.push(`${exploding} role${exploding === 1 ? "" : "s"} is in exploding demand`);
    if (highGrowth) parts.push(`${highGrowth} is in high growth`);
    if (stable) parts.push(`${stable} is more established and stable`);
    return `Future outlook varies across these careers: ${humanizeList(parts)}. This helps you weigh aggressive growth against steady, durable opportunities.`;
  })();

  const recommendationSummary = page.pageType === "comparison" && relevantCareers.length === 2
    ? compareCareers(relevantCareers[0], relevantCareers[1]).recommendationSummary
    : (() => {
        const topCareer = topCareers[0];
        if (!topCareer) return page.description;
        const reality = getCareerReality(topCareer);
        return `If you want a clear starting point, ${topCareer.title} is a strong choice because it combines ${buildTagFocus(topCareer)} with ${topCareer.timeToJob.toLowerCase()} time to leverage. ${reality.realityCheck}`;
      })();

  const faqs = (() => {
    if (page.pageType === "comparison" && relevantCareers.length === 2) {
      const [left, right] = relevantCareers;
      return [
        {
          question: `How do ${left.title} and ${right.title} differ in AI impact?`,
          answer: `${left.title} is ${left.aiImpact} AI impact while ${right.title} is ${right.aiImpact}. This shapes whether the role is more about building AI systems or applying human-centered judgment to technical problems.`,
        },
        {
          question: `Which role is better if I enjoy systems thinking?`,
          answer: `Choose the role that aligns with your preference for architecture, operations, or product experience. ${left.title} is stronger for ${buildTagFocus(left)}, while ${right.title} is better for ${buildTagFocus(right)}.`,
        },
        {
          question: `Can I move from one career to the other later?`,
          answer: `Yes. Both roles share technical skills such as software systems, tooling, and AI awareness, so transitioning is realistic when you focus on the shared foundations.`,
        },
      ];
    }
    if (page.pageType === "future") {
      return [
        {
          question: "What makes a career future-proof in tech?",
          answer: "Future-proof careers are those that combine strong demand signals with AI-friendly leverage: deep specialization, systems thinking, and work that requires judgment and adaptation.",
        },
        {
          question: "Does high AI impact mean the role is unsafe?",
          answer: "Not necessarily. High AI impact often means the role is evolving, so the practical edge is in mastering the systems around AI rather than looking for tasks that AI replaces.",
        },
        {
          question: "Where should I start if I want one of these roles?",
          answer: `Start with the core skill shown in the career card and pair it with a small project that reflects the role’s real work. Use the associated career roadmap to keep learning focused.`,
        },
      ];
    }
    if (page.pageType === "psychology") {
      return [
        {
          question: "How do I know if these careers fit my thinking style?",
          answer: "Look for careers that match your strongest traits: analytical people thrive on systems work, while creative thinkers do best in roles that reward experimentation and design.",
        },
        {
          question: "Are these roles only for one personality type?",
          answer: "No. Each career can be a good fit if you emphasize the parts that align with your strengths and use your profile to choose between similar paths.",
        },
        {
          question: "What should I compare before deciding?",
          answer: `Compare AI impact, future demand, and the everyday work style described in the career cards to find the most sustainable fit.`,
        },
      ];
    }
    return [
      {
        question: "What should I learn first for this career?",
        answer: `Focus on the core skill for the role and complement it with the supporting skills listed in the career roadmap.`,
      },
      {
        question: "How quickly can I get into the field?",
        answer: "Time to leverage varies, but the roles on this page are chosen for clear learning pathways and realistic career entry points.",
      },
      {
        question: "What is a common beginner mistake?",
        answer: "A common mistake is treating the role as a checklist instead of understanding the real systems and decisions behind the work.",
      },
    ];
  })();

  return {
    overview,
    keyDifferences,
    aiImpact,
    skills,
    difficulty,
    futureOutlook,
    recommendationSummary,
    relatedCareers: topCareers,
    faqs,
    relatedInsights,
  };
}

export function buildInsightMetadata(page: SeoInsightPage) {
  const canonical = `https://corepath.io${getInsightUrl(page.slug)}`;
  return {
    title: `${page.title} | CorePath`,
    description: page.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${page.title} | CorePath`,
      description: page.description,
      url: canonical,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} | CorePath`,
      description: page.description,
    },
  };
}

export function getInsightBreadcrumbSchema(page: SeoInsightPage) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Insights",
        item: "https://corepath.io/insights",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: page.title,
        item: `https://corepath.io${getInsightUrl(page.slug)}`,
      },
    ],
  };
}

export function getInsightFAQSchema(content: InsightContent) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
