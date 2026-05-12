import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ViewAllSection } from '../app/sections/ViewAllSection';
import { getEvaluationsForHr } from '../api';

vi.mock('../api', () => ({
  getEvaluationsForHr: vi.fn(),
}));

vi.mock('../app/components/ui/select', () => ({
  Select: ({ onValueChange, children }: any) => (
    <select onChange={(e) => onValueChange(e.target.value)}>{children}</select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <>{placeholder}</>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

vi.mock('../app/components/ViewProgressDialog', () => ({
  ViewProgressDialog: () => null,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const GOAL = {
  id: 101,
  definition: 'Ship new onboarding flow',
  relevance: 'Improves user retention',
  metric: 'Completion rate ≥ 80%',
  resource: 'Design team support',
  deadline: '2025-06-30',
  criteria: ['On time', 'Within scope'],
  progresses: [],
};

const EVALUATION_ITEM = {
  id: 201,
  name: 'Communication',
  description: 'Clarity and effectiveness of communication',
  rating: 4,
  feedback: 'Great collaborator',
};

const INITIAL_EVAL = {
  id: 1,
  employeeName: 'Alice Johnson',
  employeeJobTitle: 'Software Engineer',
  type: 'Annual',
  status: 'INITIAL',
  goals: [],
  evaluationItems: [],
};

const PENDING_GOAL_APPROVAL_EVAL = {
  id: 2,
  employeeName: 'Bob Smith',
  employeeJobTitle: 'Product Manager',
  type: 'Quarter',
  status: 'PENDING_GOAL_APPROVAL',
  goals: [GOAL],
  evaluationItems: [],
};

const WORKING_EVAL = {
  id: 3,
  employeeName: 'Carol White',
  employeeJobTitle: 'Designer',
  type: 'Annual',
  status: 'WORKING',
  goals: [GOAL],
  evaluationItems: [],
};

const REVIEW_EVAL = {
  id: 4,
  employeeName: 'David Lee',
  employeeJobTitle: 'Engineering Manager',
  type: 'Quarter',
  status: 'REVIEW',
  goals: [GOAL],
  evaluationItems: [],
};

const PENDING_REVIEW_CONFIRMATION_EVAL = {
  id: 5,
  employeeName: 'Eva Chen',
  employeeJobTitle: 'QA Engineer',
  type: 'Annual',
  status: 'PENDING_REVIEW_CONFIRMATION',
  goals: [GOAL],
  evaluationItems: [EVALUATION_ITEM],
};

const PENDING_CLOSURE_EVAL = {
  id: 6,
  employeeName: 'Frank Miller',
  employeeJobTitle: 'DevOps Engineer',
  type: 'Quarter',
  status: 'PENDING_CLOSURE',
  goals: [GOAL],
  evaluationItems: [EVALUATION_ITEM],
};

const CLOSED_EVAL = {
  id: 7,
  employeeName: 'Grace Kim',
  employeeJobTitle: 'Data Scientist',
  type: 'Annual',
  status: 'CLOSED',
  goals: [GOAL],
  evaluationItems: [EVALUATION_ITEM],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockApiWithContent(evaluations: any[]) {
  vi.mocked(getEvaluationsForHr).mockResolvedValue({
    data: { content: evaluations },
  } as any);
}

async function renderAndWait() {
  const user = userEvent.setup();
  render(<ViewAllSection />);
  await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
  return user;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ViewAllSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Loading / error states ───────────────────────────────────────────────────

  describe('loading state', () => {
    it('shows a loading indicator while fetching', () => {
      vi.mocked(getEvaluationsForHr).mockReturnValue(new Promise(() => {}));
      render(<ViewAllSection />);
      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows an error message when the API call fails', async () => {
      vi.mocked(getEvaluationsForHr).mockRejectedValue(new Error('Network error'));
      render(<ViewAllSection />);
      await waitFor(() =>
        expect(screen.getByText('Failed to load evaluations.')).toBeInTheDocument(),
      );
    });
  });

  // ── Data rendering ───────────────────────────────────────────────────────────

  describe('data rendering', () => {
    it('renders all evaluations returned by the API', async () => {
      mockApiWithContent([INITIAL_EVAL, PENDING_GOAL_APPROVAL_EVAL]);
      await renderAndWait();

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('shows a "no employees" message when the list is empty', async () => {
      mockApiWithContent([]);
      await renderAndWait();

      expect(screen.getByText('No employees found matching your filters')).toBeInTheDocument();
    });

    it('renders job title and cycle type for each row', async () => {
      mockApiWithContent([INITIAL_EVAL, PENDING_GOAL_APPROVAL_EVAL]);
      await renderAndWait();

      const table = screen.getByRole('table');
      expect(within(table).getByText('Software Engineer')).toBeInTheDocument();
      expect(within(table).getByText('Annual')).toBeInTheDocument();
      expect(within(table).getByText('Product Manager')).toBeInTheDocument();
      expect(within(table).getByText('Quarter')).toBeInTheDocument();
    });

    it('renders the mapped display status badge for each row', async () => {
      mockApiWithContent([INITIAL_EVAL, PENDING_GOAL_APPROVAL_EVAL, WORKING_EVAL]);
      await renderAndWait();

      const table = screen.getByRole('table');
      expect(within(table).getByText('Initial')).toBeInTheDocument();
      expect(within(table).getByText('Pending Goal Approval')).toBeInTheDocument();
      expect(within(table).getByText('Working')).toBeInTheDocument();
    });
  });

  // ── Dialog open / close ──────────────────────────────────────────────────────

  describe('dialog open/close', () => {
    it('opens the dialog when a row is clicked', async () => {
      mockApiWithContent([INITIAL_EVAL]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('shows employee name and job title in the dialog header', async () => {
      mockApiWithContent([INITIAL_EVAL]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Alice Johnson')).toBeInTheDocument();
      expect(within(dialog).getByText('Software Engineer')).toBeInTheDocument();
    });

    it('closes the dialog when Close is clicked', async () => {
      mockApiWithContent([INITIAL_EVAL]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));
      const dialog = screen.getByRole('dialog');
      const closeButtons = within(dialog).getAllByRole('button', { name: 'Close' });
      await user.click(closeButtons[0]);

      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
    });
  });

  // ── Dialog content by status ─────────────────────────────────────────────────

  describe('INITIAL status dialog', () => {
    it('shows an empty state with "No data yet" message', async () => {
      mockApiWithContent([INITIAL_EVAL]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('No data yet')).toBeInTheDocument();
      expect(
        within(dialog).getByText('This employee has not started their evaluation.'),
      ).toBeInTheDocument();
    });

    it('does not show goals or ratings content', async () => {
      mockApiWithContent([INITIAL_EVAL]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).queryByText('Submitted Goals')).not.toBeInTheDocument();
      expect(within(dialog).queryByRole('tab')).not.toBeInTheDocument();
    });
  });

  describe('PENDING_GOAL_APPROVAL status dialog', () => {
    it('shows the "Submitted Goals" heading', async () => {
      mockApiWithContent([PENDING_GOAL_APPROVAL_EVAL]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Bob Smith'));

      expect(within(screen.getByRole('dialog')).getByText('Submitted Goals')).toBeInTheDocument();
    });

    it('renders goal data', async () => {
      mockApiWithContent([PENDING_GOAL_APPROVAL_EVAL]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Bob Smith'));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Ship new onboarding flow')).toBeInTheDocument();
      expect(within(dialog).getByText('Improves user retention')).toBeInTheDocument();
      expect(within(dialog).getByText('Completion rate ≥ 80%')).toBeInTheDocument();
      expect(within(dialog).getByText('Design team support')).toBeInTheDocument();
      expect(within(dialog).getByText('2025-06-30')).toBeInTheDocument();
    });


    it('does not show ratings tabs or empty state', async () => {
      mockApiWithContent([PENDING_GOAL_APPROVAL_EVAL]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Bob Smith'));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).queryByText('No data yet')).not.toBeInTheDocument();
      expect(within(dialog).queryByRole('tab')).not.toBeInTheDocument();
    });
  });

  describe('WORKING status dialog', () => {
    it('shows the "Submitted Goals" heading', async () => {
      mockApiWithContent([WORKING_EVAL]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Carol White'));

      expect(within(screen.getByRole('dialog')).getByText('Submitted Goals')).toBeInTheDocument();
    });

    it('renders goal details', async () => {
      mockApiWithContent([WORKING_EVAL]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Carol White'));

      expect(within(screen.getByRole('dialog')).getByText('Ship new onboarding flow')).toBeInTheDocument();
    });
  });

  describe('REVIEW status dialog', () => {
    it('shows the "Goals & Progress" heading', async () => {
      mockApiWithContent([REVIEW_EVAL]);
      const user = await renderAndWait();

      await user.click(screen.getByText('David Lee'));

      expect(within(screen.getByRole('dialog')).getByText('Goals & Progress')).toBeInTheDocument();
    });

    it('does not show "View Progress" button when goal has no progresses', async () => {
      mockApiWithContent([REVIEW_EVAL]); // GOAL has progresses: []
      const user = await renderAndWait();

      await user.click(screen.getByText('David Lee'));

      expect(screen.queryByRole('button', { name: /view progress/i })).not.toBeInTheDocument();
    });

    it('shows "View Progress" button when goal has progress entries', async () => {
      const evalWithProgress = {
        ...REVIEW_EVAL,
        goals: [{ ...GOAL, progresses: [{ timestamp: '2025-01-15', description: 'Halfway done' }] }],
      };
      mockApiWithContent([evalWithProgress]);
      const user = await renderAndWait();

      await user.click(screen.getByText('David Lee'));

      expect(screen.getByRole('button', { name: /view progress/i })).toBeInTheDocument();
    });

    it('does not show ratings tabs or empty state', async () => {
      mockApiWithContent([REVIEW_EVAL]);
      const user = await renderAndWait();

      await user.click(screen.getByText('David Lee'));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).queryByText('No data yet')).not.toBeInTheDocument();
      expect(within(dialog).queryByRole('tab')).not.toBeInTheDocument();
    });
  });

  describe.each([
    ['PENDING_REVIEW_CONFIRMATION', PENDING_REVIEW_CONFIRMATION_EVAL, 'Eva Chen'],
    ['PENDING_CLOSURE',             PENDING_CLOSURE_EVAL,             'Frank Miller'],
    ['CLOSED',                      CLOSED_EVAL,                      'Grace Kim'],
  ])('%s status dialog', (_status, evaluation, employeeName) => {
    it('shows Ratings and Goal Records tabs', async () => {
      mockApiWithContent([evaluation]);
      const user = await renderAndWait();

      await user.click(screen.getByText(employeeName));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByRole('tab', { name: /ratings/i })).toBeInTheDocument();
      expect(within(dialog).getByRole('tab', { name: /goals & progress/i })).toBeInTheDocument();
    });

    it('renders evaluation item name and description on the Ratings tab', async () => {
      mockApiWithContent([evaluation]);
      const user = await renderAndWait();

      await user.click(screen.getByText(employeeName));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Communication')).toBeInTheDocument();
      expect(within(dialog).getByText('Clarity and effectiveness of communication')).toBeInTheDocument();
    });

    it('renders feedback text on the Ratings tab', async () => {
      mockApiWithContent([evaluation]);
      const user = await renderAndWait();

      await user.click(screen.getByText(employeeName));

      expect(screen.getByText('Great collaborator')).toBeInTheDocument();
    });

    it('shows goal details after switching to the Goal Records tab', async () => {
      mockApiWithContent([evaluation]);
      const user = await renderAndWait();

      await user.click(screen.getByText(employeeName));
      await user.click(screen.getByRole('tab', { name: /goals & progress/i }));

      expect(screen.getByText('Ship new onboarding flow')).toBeInTheDocument();
      expect(screen.getByText('Improves user retention')).toBeInTheDocument();
      expect(screen.getByText('2025-06-30')).toBeInTheDocument();
    });

    it('does not show "View Progress" when goal has no progresses', async () => {
      mockApiWithContent([evaluation]); // GOAL has progresses: []
      const user = await renderAndWait();

      await user.click(screen.getByText(employeeName));
      await user.click(screen.getByRole('tab', { name: /goals & progress/i }));

      expect(screen.queryByRole('button', { name: /view progress/i })).not.toBeInTheDocument();
    });

    it('shows "View Progress" button when goal has progress entries', async () => {
      const evalWithProgress = {
        ...evaluation,
        goals: [{ ...GOAL, progresses: [{ timestamp: '2025-03-01', description: 'Milestone reached' }] }],
      };
      mockApiWithContent([evalWithProgress]);
      const user = await renderAndWait();

      await user.click(screen.getByText(employeeName));
      await user.click(screen.getByRole('tab', { name: /goals & progress/i }));

      expect(screen.getByRole('button', { name: /view progress/i })).toBeInTheDocument();
    });

  });

  // ── Search and filters ───────────────────────────────────────────────────────

  describe('search and filters', () => {
    it('filters rows by employee name', async () => {
      mockApiWithContent([INITIAL_EVAL, PENDING_GOAL_APPROVAL_EVAL]);
      const user = await renderAndWait();

      await user.type(screen.getByPlaceholderText('Type employee name...'), 'Alice');

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
    });

    it('clears search to show all rows again', async () => {
      mockApiWithContent([INITIAL_EVAL, PENDING_GOAL_APPROVAL_EVAL]);
      const user = await renderAndWait();

      const searchInput = screen.getByPlaceholderText('Type employee name...') as HTMLInputElement;
      await user.type(searchInput, 'Alice');
      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();

      await user.clear(searchInput);
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('search is case-insensitive', async () => {
      mockApiWithContent([INITIAL_EVAL, PENDING_GOAL_APPROVAL_EVAL]);
      const user = await renderAndWait();

      await user.type(screen.getByPlaceholderText('Type employee name...'), 'alice');

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
    });

    it('filters rows by job title', async () => {
      mockApiWithContent([INITIAL_EVAL, PENDING_GOAL_APPROVAL_EVAL]);
      const user = await renderAndWait();

      const selects = screen.getAllByRole('combobox');
      await user.selectOptions(selects[0], 'Product Manager');

      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });

    it('filters rows by cycle type', async () => {
      mockApiWithContent([INITIAL_EVAL, PENDING_GOAL_APPROVAL_EVAL]);
      const user = await renderAndWait();

      const selects = screen.getAllByRole('combobox');
      await user.selectOptions(selects[1], 'Quarter');

      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });

    it('filters rows by status', async () => {
      mockApiWithContent([INITIAL_EVAL, PENDING_GOAL_APPROVAL_EVAL]);
      const user = await renderAndWait();

      const selects = screen.getAllByRole('combobox');
      await user.selectOptions(selects[2], 'Initial');

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
    });
  });
});