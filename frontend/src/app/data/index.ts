import type { Template } from '../types';

// ── Lookup data for RegisterSection (no user registration API) ────────────
export const EMPLOYEE_NAMES = [
  'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis',
  'David Wilson', 'Jessica Martinez', 'James Anderson', 'Jennifer Taylor',
  'Robert Thomas', 'Lisa Moore',
];

export const DEPARTMENTS = [
  'Engineering', 'Product Management', 'Design', 'Marketing',
  'Sales', 'Human Resources', 'Finance', 'Operations', 'Customer Success', 'Legal',
];

export const JOB_TITLES = [
  'Software Engineer', 'Senior Software Engineer', 'Engineering Manager',
  'Product Manager', 'Senior Product Manager', 'UX Designer', 'UI Designer',
  'Marketing Manager', 'Sales Representative', 'HR Manager',
  'Financial Analyst', 'Operations Manager',
];

export const SUPERVISORS = [
  'Alice Chen - Engineering Manager', 'Bob Anderson - VP of Engineering',
  'Carol Martinez - Product Director', 'Dan Williams - Design Lead',
  'Emma Thompson - VP of Marketing', 'Frank Garcia - Sales Director',
  'Grace Lee - HR Director', 'Henry Davis - CFO',
];

// ── Template mock data (no template API) ─────────────────────────────────
export const INITIAL_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Engineering Annual Review',
    jobTitle: 'Software Engineer',
    evaluationCycle: 'Annual Review',
    criteria: [
      { id: '1-1', title: 'Technical Proficiency', description: 'Demonstrates strong command of relevant technologies, writes clean and maintainable code, and applies best practices consistently.' },
      { id: '1-2', title: 'Problem Solving', description: 'Identifies root causes effectively, proposes well-reasoned solutions, and handles ambiguous or complex challenges independently.' },
      { id: '1-3', title: 'Collaboration', description: 'Works constructively with peers and cross-functional teams, gives and receives feedback gracefully, and contributes to a positive team culture.' },
    ],
  },
  {
    id: '2',
    name: 'Product Manager Mid-Year',
    jobTitle: 'Product Manager',
    evaluationCycle: 'Semi-Annual Review',
    criteria: [
      { id: '2-1', title: 'Roadmap Execution', description: 'Delivers features and initiatives on schedule, balances scope with quality, and adjusts priorities based on business needs.' },
      { id: '2-2', title: 'Stakeholder Communication', description: 'Keeps stakeholders informed with clear, timely updates and manages expectations proactively.' },
    ],
  },
  {
    id: '3',
    name: 'Design Quarterly Check-in',
    jobTitle: 'UX Designer',
    evaluationCycle: 'Quarterly Review',
    criteria: [
      { id: '3-1', title: 'Design Quality', description: 'Produces high-fidelity, user-centred designs that align with brand standards and accessibility guidelines.' },
      { id: '3-2', title: 'User Research', description: 'Conducts and synthesises user research to inform design decisions and validate assumptions.' },
      { id: '3-3', title: 'Iteration Speed', description: 'Responds quickly to feedback, delivers multiple design iterations within sprint timelines.' },
    ],
  },
  {
    id: '4',
    name: 'Senior Engineer Leadership Review',
    jobTitle: 'Senior Software Engineer',
    evaluationCycle: 'Annual Review',
    criteria: [
      { id: '4-1', title: 'Technical Leadership', description: 'Leads architectural decisions, mentors junior engineers, and drives technical standards across the team.' },
      { id: '4-2', title: 'Delivery Impact', description: 'Consistently delivers high-impact work that moves key metrics and reduces technical debt.' },
      { id: '4-3', title: 'Cross-team Influence', description: 'Builds relationships across teams, aligns engineering efforts with product and business goals.' },
      { id: '4-4', title: 'Mentorship', description: 'Actively invests in the growth of teammates through pairing, code review feedback, and knowledge sharing.' },
    ],
  },
];

