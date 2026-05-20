import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ReviewGoalSection } from '../app/sections/ReviewGoalSection';
import { getEvaluationsForManager, approveGoals, rejectGoals } from '../api';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../api', () => ({
  getEvaluationsForManager: vi.fn(),
  approveGoals: vi.fn(),
  rejectGoals: vi.fn(),
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

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PENDING_EVALUATION = {
  id: 1,
  employeeName: 'Alice Johnson',
  employeeJobTitle: 'Software Engineer',
  type: 'Annual',
  status: 'PENDING_GOAL_APPROVAL',
  goals: [
    {
      id: 101,
      definition: 'Ship new onboarding flow',
      relevance: 'Improves user retention',
      metric: 'Completion rate ≥ 80 %',
      resource: 'Design team support',
      deadline: '2025-06-30',
      criteria: ['On time', 'Within scope'],
    },
  ],
};

const SECOND_EVALUATION = {
      id: 3,
      employeeName: 'Carol White',
      employeeJobTitle: 'Designer',
      type: 'Quarter',
      status: 'PENDING_GOAL_APPROVAL',
      goals: [],
};

const APPROVED_EVALUATION = {
  id: 2,
  employeeName: 'Bob Smith',
  employeeJobTitle: 'Product Manager',
  type: 'Annual',
  status: 'WORKING',
  goals: [],
};

function mockApiWithContent(evaluations: typeof PENDING_EVALUATION[]) {
  vi.mocked(getEvaluationsForManager).mockResolvedValue({
    data: { content: evaluations },
  } as any);
}

async function dismissNotification(user: ReturnType<typeof userEvent.setup>) {
  const okButton = await screen.findByRole('button', { name: /ok/i });
  await user.click(okButton);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function renderAndWait() {
  const user = userEvent.setup();
  render(<ReviewGoalSection />);
  // Wait until the loading spinner disappears
  await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
  return user;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ReviewGoalSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(approveGoals).mockResolvedValue({} as any);
    vi.mocked(rejectGoals).mockResolvedValue({} as any);
  });

  // ── Loading / error states ─────────────────────────────────────────────────

  describe('loading state', () => {
    it('shows a loading indicator while fetching', () => {
      // Never resolve so we stay in loading
      vi.mocked(getEvaluationsForManager).mockReturnValue(new Promise(() => {}));
      render(<ReviewGoalSection />);
      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows an error message when the API call fails', async () => {
      vi.mocked(getEvaluationsForManager).mockRejectedValue(new Error('Network error'));
      render(<ReviewGoalSection />);
      await waitFor(() =>
        expect(screen.getByText('Failed to load evaluations.')).toBeInTheDocument(),
      );
    });
  });

  // ── Data rendering ─────────────────────────────────────────────────────────

  describe('data rendering', () => {
    it('renders only PENDING_GOAL_APPROVAL evaluations', async () => {
      mockApiWithContent([PENDING_EVALUATION, APPROVED_EVALUATION]);
      await renderAndWait();

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
    });


    it('shows a "no employees" message when the list is empty', async () => {
      mockApiWithContent([]);
      await renderAndWait();

      expect(
        screen.getByText('No employees found matching your filters'),
      ).toBeInTheDocument();
    });

    it('renders job title and cycle type for each row', async () => {
      mockApiWithContent([PENDING_EVALUATION, SECOND_EVALUATION]);
      await renderAndWait();

      const table = screen.getByRole('table');
      expect(within(table).getByText('Software Engineer')).toBeInTheDocument();
      expect(within(table).getByText('Annual')).toBeInTheDocument();
      expect(within(table).getByText('Designer')).toBeInTheDocument();
      expect(within(table).getByText('Quarter')).toBeInTheDocument();
    });

    it('does not render a Status column (hideStatus = true)', async () => {
      mockApiWithContent([PENDING_EVALUATION]);
      await renderAndWait();

      expect(screen.queryByText('Status')).not.toBeInTheDocument();
      expect(screen.queryByText('Pending Goal Approval')).not.toBeInTheDocument();
    });
  });

  // ── Dialog behaviour ───────────────────────────────────────────────────────

  describe('ReviewDialog', () => {
    it('opens when a row is clicked', async () => {
      mockApiWithContent([PENDING_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Ship new onboarding flow')).toBeInTheDocument();
    });

    it('displays all goal fields inside the dialog', async () => {
      mockApiWithContent([PENDING_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Improves user retention')).toBeInTheDocument();
      expect(within(dialog).getByText('Completion rate ≥ 80 %')).toBeInTheDocument();
      expect(within(dialog).getByText('Design team support')).toBeInTheDocument();
      expect(within(dialog).getByText('2025-06-30')).toBeInTheDocument();
      expect(within(dialog).getByText('On time')).toBeInTheDocument();
      expect(within(dialog).getByText('Within scope')).toBeInTheDocument();
    });

    it('closes when Cancel is clicked', async () => {
      mockApiWithContent([PENDING_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
    });

    it('shows "No goals submitted" when the evaluation has no goals', async () => {
      mockApiWithContent([{ ...PENDING_EVALUATION, goals: [] }]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));

      expect(screen.getByText('No goals submitted.')).toBeInTheDocument();
    });
  });

  // ── Approve flow ───────────────────────────────────────────────────────────

  describe('approve action', () => {
    it('calls approveGoals with the correct id', async () => {
      mockApiWithContent([PENDING_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));
      await user.click(screen.getByRole('button', { name: /approve/i }));

      expect(approveGoals).toHaveBeenCalledWith(PENDING_EVALUATION.id);
      expect(screen.getByText('You have approved the goals')).toBeInTheDocument();
    });

    it('closes the dialog after approving', async () => {
      mockApiWithContent([PENDING_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));
      await user.click(screen.getByRole('button', { name: /approve/i }));
      await dismissNotification(user);

      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
    });

    it('reloads the list after approving (removes the row)', async () => {
      mockApiWithContent([PENDING_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));
      await user.click(screen.getByRole('button', { name: /approve/i }));
      await dismissNotification(user);
      await waitFor(() =>
        expect(getEvaluationsForManager).toHaveBeenCalledTimes(2),
      );
    });
  });

  // ── Reject flow ────────────────────────────────────────────────────────────

  describe('reject action', () => {
    it('calls rejectGoals with the correct id', async () => {
      mockApiWithContent([PENDING_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));
      await user.click(screen.getByRole('button', { name: /reject/i }));

      expect(rejectGoals).toHaveBeenCalledWith(PENDING_EVALUATION.id);
      expect(screen.getByText('You have rejected the goals')).toBeInTheDocument();
    });

    it('closes the dialog after rejecting', async () => {
      mockApiWithContent([PENDING_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));
      await user.click(screen.getByRole('button', { name: /reject/i }));
      await dismissNotification(user);

      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
    });

    it('reloads the list after rejecting (removes the row)', async () => {
      mockApiWithContent([PENDING_EVALUATION]);
      const user = await renderAndWait();


      await user.click(screen.getByText('Alice Johnson'));
      await user.click(screen.getByRole('button', { name: /reject/i }));
      await dismissNotification(user);

      await waitFor(() =>
        expect(getEvaluationsForManager).toHaveBeenCalledTimes(2),
      );
    });
  });

  // ── Filter / search ────────────────────────────────────────────────────────

  describe('search and filters', () => {

    it('filters rows by employee name', async () => {
      mockApiWithContent([PENDING_EVALUATION, SECOND_EVALUATION]);
      const user = await renderAndWait();

      await user.type(screen.getByPlaceholderText('Type employee name...'), 'Alice');

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.queryByText('Carol White')).not.toBeInTheDocument();
    });

    it('clears search to show all rows again', async () => {
      mockApiWithContent([PENDING_EVALUATION, SECOND_EVALUATION]);
      const user = await renderAndWait();

      const searchInput = screen.getByPlaceholderText('Type employee name...') as HTMLInputElement;
      await user.type(searchInput, 'Alice');
      expect(screen.queryByText('Carol White')).not.toBeInTheDocument();

      // Clear the search
      await user.clear(searchInput);
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Carol White')).toBeInTheDocument();
    });

    it('search is case-insensitive', async () => {
      mockApiWithContent([PENDING_EVALUATION, SECOND_EVALUATION]);
      const user = await renderAndWait();

      await user.type(screen.getByPlaceholderText('Type employee name...'), 'alice');

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.queryByText('Carol White')).not.toBeInTheDocument();
    });

    it('filters rows by job title', async () => {
      mockApiWithContent([PENDING_EVALUATION, SECOND_EVALUATION]);
      const user = await renderAndWait();

      const jobSelects = screen.getAllByRole('combobox');
      await user.selectOptions(jobSelects[0], 'Designer');

      expect(screen.getByText('Carol White')).toBeInTheDocument();
      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });

    it('filters rows by cycle type', async () => {
      mockApiWithContent([PENDING_EVALUATION, SECOND_EVALUATION]);
      const user = await renderAndWait();
      
      const cycleSelects = screen.getAllByRole('combobox');
      await user.selectOptions(cycleSelects[1], 'Quarter');

      expect(screen.getByText('Carol White')).toBeInTheDocument();
      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });
  });

  // ── API call parameters ────────────────────────────────────────────────────

  describe('API integration', () => {
    it('calls getEvaluationsForManager with correct pageable params on mount', async () => {
      mockApiWithContent([]);
      await renderAndWait();

      expect(getEvaluationsForManager).toHaveBeenCalledWith({
        pageable: { page: 0, size: 100 },
      });
    });

    it('calls getEvaluationsForManager exactly once on mount', async () => {
      mockApiWithContent([]);
      await renderAndWait();

      expect(getEvaluationsForManager).toHaveBeenCalledTimes(1);
    });
  });
});
