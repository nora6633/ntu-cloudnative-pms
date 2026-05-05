import type { AuditLog, Template } from '../types';

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

// ── Audit mock data (no audit API) ────────────────────────────────────────
export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: '1',  timestamp: '2026-04-21 14:35:22', actor: 'sarah.johnson@company.com',  actorRole: 'Software Engineer',    actionType: 'CREATE', affectedModule: 'Goals',     affectedRecordId: 'GOAL-2847', changeSummary: 'Created new goal: Complete React Advanced Course' },
  { id: '2',  timestamp: '2026-04-21 13:22:15', actor: 'admin@company.com',           actorRole: 'Administrator',         actionType: 'UPDATE', affectedModule: 'Users',     affectedRecordId: 'USER-1523', changeSummary: 'Updated user role from Employee to Senior Engineer' },
  { id: '3',  timestamp: '2026-04-21 12:18:45', actor: 'michael.brown@company.com',  actorRole: 'Product Manager',       actionType: 'DELETE', affectedModule: 'Goals',     affectedRecordId: 'GOAL-2741', changeSummary: 'Deleted goal: Outdated quarterly objective' },
  { id: '4',  timestamp: '2026-04-21 11:05:33', actor: 'emily.davis@company.com',    actorRole: 'UX Designer',           actionType: 'CREATE', affectedModule: 'Goals',     affectedRecordId: 'GOAL-2846', changeSummary: 'Created new goal: Design System Update' },
  { id: '5',  timestamp: '2026-04-21 10:42:18', actor: 'admin@company.com',           actorRole: 'Administrator',         actionType: 'UPDATE', affectedModule: 'Reviews',   affectedRecordId: 'REV-5623',  changeSummary: 'Approved goal review for Sarah Johnson' },
  { id: '6',  timestamp: '2026-04-21 09:30:27', actor: 'david.wilson@company.com',   actorRole: 'Engineering Manager',   actionType: 'CREATE', affectedModule: 'Users',     affectedRecordId: 'USER-1524', changeSummary: 'Registered new employee: Jessica Martinez' },
  { id: '7',  timestamp: '2026-04-21 08:15:52', actor: 'sarah.johnson@company.com',  actorRole: 'Software Engineer',    actionType: 'UPDATE', affectedModule: 'Goals',     affectedRecordId: 'GOAL-2847', changeSummary: 'Updated goal progress' },
  { id: '8',  timestamp: '2026-04-20 16:55:41', actor: 'admin@company.com',           actorRole: 'Administrator',         actionType: 'DELETE', affectedModule: 'Users',     affectedRecordId: 'USER-1401', changeSummary: 'Removed inactive user account' },
  { id: '9',  timestamp: '2026-04-20 15:22:09', actor: 'james.anderson@company.com', actorRole: 'Marketing Manager',     actionType: 'CREATE', affectedModule: 'Goals',     affectedRecordId: 'GOAL-2845', changeSummary: 'Created new goal: Q2 Marketing Campaign' },
  { id: '10', timestamp: '2026-04-20 14:10:33', actor: 'emily.davis@company.com',    actorRole: 'UX Designer',           actionType: 'UPDATE', affectedModule: 'Goals',     affectedRecordId: 'GOAL-2846', changeSummary: 'Updated target value from 15 to 20 components' },
  { id: '11', timestamp: '2026-04-20 13:45:21', actor: 'admin@company.com',           actorRole: 'Administrator',         actionType: 'UPDATE', affectedModule: 'Reviews',   affectedRecordId: 'REV-5621',  changeSummary: 'Rejected goal review for David Wilson' },
  { id: '12', timestamp: '2026-04-20 12:30:15', actor: 'michael.brown@company.com',  actorRole: 'Product Manager',       actionType: 'CREATE', affectedModule: 'Templates', affectedRecordId: 'TMPL-341',  changeSummary: 'Created new goal template: Product Launch' },
  { id: '13', timestamp: '2026-04-20 11:18:44', actor: 'sarah.johnson@company.com',  actorRole: 'Software Engineer',    actionType: 'UPDATE', affectedModule: 'Goals',     affectedRecordId: 'GOAL-2847', changeSummary: 'Updated goal deadline' },
  { id: '14', timestamp: '2026-04-20 10:05:52', actor: 'david.wilson@company.com',   actorRole: 'Engineering Manager',   actionType: 'DELETE', affectedModule: 'Goals',     affectedRecordId: 'GOAL-2732', changeSummary: 'Deleted duplicate goal entry' },
  { id: '15', timestamp: '2026-04-20 09:42:31', actor: 'admin@company.com',           actorRole: 'Administrator',         actionType: 'CREATE', affectedModule: 'Users',     affectedRecordId: 'USER-1525', changeSummary: 'Registered new employee: Robert Chen' },
];
