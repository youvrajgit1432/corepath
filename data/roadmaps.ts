export interface RoadmapStep {
  phase: number;
  title: string;
  duration: string;
  description: string;
  skills: string[];
  milestone: string;
}

export interface SkillNode {
  id: string;
  label: string;
  type: "core" | "supporting" | "optional";
  dependsOn?: string[];
}

export interface CareerRoadmap {
  careerId: string;
  steps: RoadmapStep[];
  skillTree: SkillNode[];
}

export const roadmaps: CareerRoadmap[] = [
  {
    careerId: "backend-engineer",
    steps: [
      {
        phase: 1,
        title: "Programming Foundations",
        duration: "6–8 weeks",
        description: "Pick one backend language deeply. Python is recommended for beginners.",
        skills: ["Python basics", "Functions & OOP", "Error handling", "File I/O"],
        milestone: "Build a CLI tool that reads/writes data",
      },
      {
        phase: 2,
        title: "Web & API Basics",
        duration: "4–6 weeks",
        description: "Understand HTTP, build your first REST API using FastAPI or Flask.",
        skills: ["HTTP methods", "REST principles", "FastAPI / Flask", "JSON responses"],
        milestone: "Build a working REST API with 3+ endpoints",
      },
      {
        phase: 3,
        title: "Databases",
        duration: "4–6 weeks",
        description: "Learn SQL deeply. Connect your API to a real database.",
        skills: ["SQL (SELECT, JOIN, INDEX)", "PostgreSQL", "ORM basics (SQLAlchemy)", "Migrations"],
        milestone: "API connected to a PostgreSQL database",
      },
      {
        phase: 4,
        title: "System Design Core",
        duration: "6–8 weeks",
        description: "This is your ONE CORE skill. Learn how to think at scale.",
        skills: ["Caching (Redis)", "Load balancing concepts", "API rate limiting", "Async programming"],
        milestone: "Design a scalable architecture diagram for a real app",
      },
      {
        phase: 5,
        title: "Deployment & DevOps Basics",
        duration: "3–4 weeks",
        description: "Get your API live. Understand Docker and basic cloud.",
        skills: ["Docker basics", "Environment variables", "Deploy to Railway / Render", "Logging"],
        milestone: "Deploy a working API to production",
      },
    ],
    skillTree: [
      { id: "python", label: "Python", type: "core" },
      { id: "http", label: "HTTP / REST", type: "core", dependsOn: ["python"] },
      { id: "fastapi", label: "FastAPI", type: "supporting", dependsOn: ["http"] },
      { id: "sql", label: "SQL", type: "core", dependsOn: ["python"] },
      { id: "postgres", label: "PostgreSQL", type: "supporting", dependsOn: ["sql"] },
      { id: "system-design", label: "System Design ★", type: "core", dependsOn: ["fastapi", "postgres"] },
      { id: "redis", label: "Redis / Caching", type: "supporting", dependsOn: ["system-design"] },
      { id: "docker", label: "Docker", type: "supporting", dependsOn: ["system-design"] },
      { id: "async", label: "Async / Concurrency", type: "optional", dependsOn: ["system-design"] },
    ],
  },
  {
    careerId: "frontend-engineer",
    steps: [
      {
        phase: 1,
        title: "HTML, CSS & JavaScript",
        duration: "6–8 weeks",
        description: "Master the fundamentals before touching any framework.",
        skills: ["HTML semantics", "CSS layout (Flexbox, Grid)", "JavaScript ES6+", "DOM manipulation"],
        milestone: "Build a responsive static webpage from scratch",
      },
      {
        phase: 2,
        title: "React Fundamentals",
        duration: "6–8 weeks",
        description: "Learn React as a component model, not just a library.",
        skills: ["JSX", "Props & State", "useEffect / useState", "Component composition"],
        milestone: "Build a multi-page React app with routing",
      },
      {
        phase: 3,
        title: "TypeScript & Tooling",
        duration: "3–4 weeks",
        description: "Type safety prevents bugs at scale. Essential for teams.",
        skills: ["TypeScript basics", "Interfaces & types", "tsconfig", "ESLint / Prettier"],
        milestone: "Refactor a React app to full TypeScript",
      },
      {
        phase: 4,
        title: "Component Architecture ★",
        duration: "6–8 weeks",
        description: "Your core skill. Learn to build reusable, scalable component systems.",
        skills: ["Design systems", "Compound components", "Custom hooks", "Accessibility (a11y)"],
        milestone: "Build a reusable component library with documentation",
      },
      {
        phase: 5,
        title: "Next.js & Performance",
        duration: "4–6 weeks",
        description: "Production-grade React with SSR, routing, and optimization.",
        skills: ["Next.js App Router", "SSR vs SSG", "Image optimization", "Core Web Vitals"],
        milestone: "Deploy a Next.js app with 90+ Lighthouse score",
      },
    ],
    skillTree: [
      { id: "html-css", label: "HTML & CSS", type: "core" },
      { id: "js", label: "JavaScript", type: "core", dependsOn: ["html-css"] },
      { id: "react", label: "React", type: "core", dependsOn: ["js"] },
      { id: "typescript", label: "TypeScript", type: "supporting", dependsOn: ["react"] },
      { id: "component-arch", label: "Component Architecture ★", type: "core", dependsOn: ["react", "typescript"] },
      { id: "tailwind", label: "Tailwind CSS", type: "supporting", dependsOn: ["html-css"] },
      { id: "nextjs", label: "Next.js", type: "supporting", dependsOn: ["component-arch"] },
      { id: "testing", label: "Testing (Vitest)", type: "optional", dependsOn: ["component-arch"] },
      { id: "perf", label: "Web Performance", type: "optional", dependsOn: ["nextjs"] },
    ],
  },
  {
    careerId: "data-engineer",
    steps: [
      {
        phase: 1,
        title: "Python & SQL Foundations",
        duration: "6–8 weeks",
        description: "Every data engineer writes Python and SQL daily.",
        skills: ["Python (pandas, numpy)", "SQL (advanced queries)", "Data types & schemas"],
        milestone: "Write a Python script that queries and transforms SQL data",
      },
      {
        phase: 2,
        title: "Data Pipeline Design ★",
        duration: "8–10 weeks",
        description: "Your core skill. Learn how data moves from source to destination reliably.",
        skills: ["ETL concepts", "Apache Airflow (DAGs)", "dbt (transformations)", "Pipeline testing"],
        milestone: "Build an automated ETL pipeline with scheduling",
      },
      {
        phase: 3,
        title: "Data Storage & Warehousing",
        duration: "4–6 weeks",
        description: "Understand how analytical data is stored differently from transactional data.",
        skills: ["Data warehouses (BigQuery / Redshift)", "Partitioning", "Columnar storage", "Star schema"],
        milestone: "Design a data warehouse schema for a sample business",
      },
      {
        phase: 4,
        title: "Distributed Processing",
        duration: "4–6 weeks",
        description: "Process data too large for a single machine.",
        skills: ["Apache Spark basics", "Batch vs streaming", "Partitioning strategies"],
        milestone: "Process a large dataset using PySpark",
      },
      {
        phase: 5,
        title: "Cloud & Orchestration",
        duration: "3–4 weeks",
        description: "Deploy pipelines to the cloud where real work happens.",
        skills: ["Cloud storage (S3 / GCS)", "Managed services", "Monitoring pipelines"],
        milestone: "Deploy a pipeline to a cloud environment",
      },
    ],
    skillTree: [
      { id: "python-de", label: "Python", type: "core" },
      { id: "sql-de", label: "Advanced SQL", type: "core" },
      { id: "pipeline", label: "Data Pipeline Design ★", type: "core", dependsOn: ["python-de", "sql-de"] },
      { id: "airflow", label: "Apache Airflow", type: "supporting", dependsOn: ["pipeline"] },
      { id: "dbt", label: "dbt", type: "supporting", dependsOn: ["pipeline"] },
      { id: "warehouse", label: "Data Warehouse", type: "supporting", dependsOn: ["sql-de"] },
      { id: "spark", label: "Apache Spark", type: "optional", dependsOn: ["pipeline"] },
      { id: "cloud-de", label: "Cloud (GCP / AWS)", type: "supporting", dependsOn: ["pipeline"] },
    ],
  },
  {
    careerId: "devops-engineer",
    steps: [
      {
        phase: 1,
        title: "Linux & Networking",
        duration: "6–8 weeks",
        description: "Everything in DevOps runs on Linux. You must be fluent.",
        skills: ["Bash scripting", "File permissions", "Processes & services", "TCP/IP basics"],
        milestone: "Administer a Linux server via SSH with confidence",
      },
      {
        phase: 2,
        title: "Containers & Docker",
        duration: "4–6 weeks",
        description: "Containers are the atomic unit of modern deployment.",
        skills: ["Docker images & containers", "Dockerfile", "Docker Compose", "Container networking"],
        milestone: "Containerize a multi-service application",
      },
      {
        phase: 3,
        title: "Cloud Infrastructure ★",
        duration: "8–10 weeks",
        description: "Your core skill. Learn to provision and manage cloud resources as code.",
        skills: ["AWS or GCP fundamentals", "Terraform (IaC)", "VPC / Networking", "IAM / Security"],
        milestone: "Provision a cloud environment using Terraform",
      },
      {
        phase: 4,
        title: "Kubernetes",
        duration: "6–8 weeks",
        description: "Orchestrate containers at scale. Industry standard.",
        skills: ["Pods, Services, Deployments", "ConfigMaps & Secrets", "Helm charts", "Ingress"],
        milestone: "Deploy an application to a Kubernetes cluster",
      },
      {
        phase: 5,
        title: "CI/CD & Monitoring",
        duration: "4–5 weeks",
        description: "Automate delivery and observe systems in production.",
        skills: ["GitHub Actions", "Pipeline stages", "Grafana / Prometheus", "Alerting"],
        milestone: "Build a full CI/CD pipeline with monitoring dashboards",
      },
    ],
    skillTree: [
      { id: "linux", label: "Linux", type: "core" },
      { id: "networking", label: "Networking", type: "core", dependsOn: ["linux"] },
      { id: "docker-dv", label: "Docker", type: "core", dependsOn: ["linux"] },
      { id: "cloud-infra", label: "Cloud Infrastructure ★", type: "core", dependsOn: ["docker-dv", "networking"] },
      { id: "terraform", label: "Terraform", type: "supporting", dependsOn: ["cloud-infra"] },
      { id: "kubernetes", label: "Kubernetes", type: "supporting", dependsOn: ["docker-dv", "cloud-infra"] },
      { id: "cicd", label: "CI/CD", type: "supporting", dependsOn: ["cloud-infra"] },
      { id: "monitoring", label: "Monitoring (Grafana)", type: "optional", dependsOn: ["kubernetes"] },
    ],
  },
  {
    careerId: "ml-engineer",
    steps: [
      {
        phase: 1,
        title: "Python & Math Foundations",
        duration: "8–10 weeks",
        description: "ML is applied math. Build the foundation before touching models.",
        skills: ["Python (numpy, pandas)", "Linear algebra basics", "Statistics", "Data visualization"],
        milestone: "Analyze a real dataset and visualize insights",
      },
      {
        phase: 2,
        title: "Machine Learning Concepts",
        duration: "8–10 weeks",
        description: "Understand how models learn — not just how to use them.",
        skills: ["Supervised / unsupervised learning", "scikit-learn", "Model evaluation", "Feature engineering"],
        milestone: "Train and evaluate a classification model",
      },
      {
        phase: 3,
        title: "Deep Learning & PyTorch",
        duration: "6–8 weeks",
        description: "The foundation for modern AI systems.",
        skills: ["Neural networks", "PyTorch", "Training loops", "GPU basics"],
        milestone: "Train a neural network on a real dataset",
      },
      {
        phase: 4,
        title: "ML System Deployment (MLOps) ★",
        duration: "8–10 weeks",
        description: "Your core skill. A model in a notebook is worthless. Get it to production.",
        skills: ["Model serving (FastAPI)", "Docker for ML", "Experiment tracking (MLflow)", "Model versioning"],
        milestone: "Deploy a model as a live REST API",
      },
      {
        phase: 5,
        title: "LLMs & Vector Systems",
        duration: "4–6 weeks",
        description: "Understand the AI era's most important technology stack.",
        skills: ["LLM APIs (OpenAI / Anthropic)", "Embeddings", "Vector databases", "RAG basics"],
        milestone: "Build a working RAG pipeline over your own data",
      },
    ],
    skillTree: [
      { id: "python-ml", label: "Python", type: "core" },
      { id: "math", label: "Math & Statistics", type: "core" },
      { id: "ml-concepts", label: "ML Concepts", type: "core", dependsOn: ["python-ml", "math"] },
      { id: "pytorch", label: "PyTorch", type: "supporting", dependsOn: ["ml-concepts"] },
      { id: "feature-eng", label: "Feature Engineering", type: "supporting", dependsOn: ["ml-concepts"] },
      { id: "mlops", label: "MLOps ★", type: "core", dependsOn: ["pytorch", "feature-eng"] },
      { id: "mlflow", label: "MLflow", type: "supporting", dependsOn: ["mlops"] },
      { id: "vector-db", label: "Vector Databases", type: "optional", dependsOn: ["mlops"] },
      { id: "llm", label: "LLM Integration", type: "optional", dependsOn: ["vector-db"] },
    ],
  },
  {
    careerId: "product-designer",
    steps: [
      {
        phase: 1,
        title: "Design Principles",
        duration: "4–6 weeks",
        description: "Learn the visual grammar every designer must speak.",
        skills: ["Typography", "Color theory", "Spacing & layout", "Visual hierarchy"],
        milestone: "Redesign an existing app screen with clear reasoning",
      },
      {
        phase: 2,
        title: "Figma Proficiency",
        duration: "4–5 weeks",
        description: "Figma is the industry-standard tool. Get fluent.",
        skills: ["Frames & components", "Auto layout", "Variants", "Prototyping basics"],
        milestone: "Build a 5-screen prototype in Figma",
      },
      {
        phase: 3,
        title: "User Research",
        duration: "4–6 weeks",
        description: "Design without research is guessing. Learn to talk to users.",
        skills: ["Interview techniques", "Usability testing", "Affinity mapping", "Personas"],
        milestone: "Conduct 5 user interviews and synthesize findings",
      },
      {
        phase: 4,
        title: "Design Systems ★",
        duration: "8–10 weeks",
        description: "Your core skill. Design at scale requires systems, not one-off screens.",
        skills: ["Component libraries", "Tokens (color, spacing, type)", "Documentation", "Accessibility (WCAG)"],
        milestone: "Build a complete design system in Figma from scratch",
      },
      {
        phase: 5,
        title: "Interaction Design & Handoff",
        duration: "3–4 weeks",
        description: "Bring designs to life and collaborate effectively with engineers.",
        skills: ["Micro-interactions", "Motion principles", "Dev handoff (Figma inspect)", "Design QA"],
        milestone: "Deliver a production-ready design with full handoff specs",
      },
    ],
    skillTree: [
      { id: "principles", label: "Design Principles", type: "core" },
      { id: "figma", label: "Figma", type: "core", dependsOn: ["principles"] },
      { id: "research", label: "User Research", type: "core" },
      { id: "design-systems", label: "Design Systems ★", type: "core", dependsOn: ["figma", "research"] },
      { id: "a11y", label: "Accessibility", type: "supporting", dependsOn: ["design-systems"] },
      { id: "tokens", label: "Design Tokens", type: "supporting", dependsOn: ["design-systems"] },
      { id: "interaction", label: "Interaction Design", type: "optional", dependsOn: ["figma"] },
      { id: "handoff", label: "Dev Handoff", type: "optional", dependsOn: ["design-systems"] },
    ],
  },
];

export function getRoadmapById(careerId: string): CareerRoadmap | undefined {
  return roadmaps.find((r) => r.careerId === careerId);
}
