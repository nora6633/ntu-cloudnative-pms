import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ReviewSection } from '../app/sections/ReviewSection';
import { getEvaluationsForManager, draftReview, submitReview } from '../api';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../api', () => ({
  getEvaluationsForManager: vi.fn(),
  draftReview: vi.fn(),
  submitReview: vi.fn(),
}));

// Mock the Select component to avoid Radix UI pointer-events issues in tests
vi.mock('../app/components/ui/select', () => ({
  Select: ({ onValueChange, children }: any) => (
    <select onChange={(e) => onValueChange(e.target.value)}>{children}</select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <>{placeholder}</>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

// Mock ViewProgressDialog to isolate ReviewSection from its internals
vi.mock('../app/components/ViewProgressDialog', () => ({
  ViewProgressDialog: () => null,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const EVALUATION_ITEM = {
  id: 201,
  name: 'Communication',
  description: 'Clarity and effectiveness of communication',
  rating: 0,
  feedback: '',
};

const REVIEW_EVALUATION = {
  id: 1,
  employeeName: 'Alice Johnson',
  employeeJobTitle: 'Software Engineer',
  type: 'Annual',
  status: 'REVIEW',
  evaluationItems: [EVALUATION_ITEM],
  goals: [
    {
      id: 101,
      definition: 'Ship new onboarding flow',
      relevance: 'Improves user retention',
      metric: 'Completion rate ≥ 80%',
      deadline: '2025-06-30',
      criteria: ['On time'],
      progresses: [],
    },
  ],
};

const SECOND_EVALUATION = {
    id: 3,
    employeeName: 'Carol White',
    employeeJobTitle: 'Designer',
    type: 'Quarter',
    status: 'REVIEW',
    evaluationItems: [],
    goals: [],
};

const NON_REVIEW_EVALUATION = {
  id: 2,
  employeeName: 'Bob Smith',
  employeeJobTitle: 'Product Manager',
  type: 'Quarter',
  status: 'PENDING_GOAL_APPROVAL',
  evaluationItems: [],
  goals: [],
};

function mockApi(evaluations: typeof REVIEW_EVALUATION[]) {
  vi.mocked(getEvaluationsForManager).mockResolvedValue({
    data: { content: evaluations },
  } as any);
}

async function renderAndWait() {
  const user = userEvent.setup();
  render(<ReviewSection />);
  await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
  return user;
}

async function dismissNotification(user: ReturnType<typeof userEvent.setup>) {
  const okButton = await screen.findByRole('button', { name: /ok/i });
  await user.click(okButton);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ReviewSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(draftReview).mockResolvedValue({} as any);
    vi.mocked(submitReview).mockResolvedValue({} as any);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  // ── Loading / error states ─────────────────────────────────────────────────

  describe('loading state', () => {
    it('shows a loading indicator while fetching', () => {
      vi.mocked(getEvaluationsForManager).mockReturnValue(new Promise(() => {}));
      render(<ReviewSection />);
      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows an error message when the API call fails', async () => {
      vi.mocked(getEvaluationsForManager).mockRejectedValue(new Error('Network error'));
      render(<ReviewSection />);
      await waitFor(() =>
        expect(screen.getByText('Failed to load evaluations.')).toBeInTheDocument(),
      );
    });
  });

  // ── Data rendering ─────────────────────────────────────────────────────────

  describe('data rendering', () => {
    it('renders only REVIEW status evaluations', async () => {
      mockApi([REVIEW_EVALUATION, NON_REVIEW_EVALUATION]);
      await renderAndWait();

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
    });

    it('shows a "no employees" message when the list is empty', async () => {
      mockApi([]);
      await renderAndWait();

      expect(screen.getByText('No employees found matching your filters')).toBeInTheDocument();
    });

    it('does not render a Status column (hideStatus = true)', async () => {
      mockApi([REVIEW_EVALUATION]);
      await renderAndWait();

      expect(screen.queryByText('Status')).not.toBeInTheDocument();
      expect(screen.queryByText('Review Drafting')).not.toBeInTheDocument();
    });

  });

  // ── Dialog open / close ────────────────────────────────────────────────────

  describe('dialog open/close', () => {
    it('opens the dialog when a row is clicked', async () => {
      mockApi([REVIEW_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('shows employee name and job title in the dialog header', async () => {
      mockApi([REVIEW_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Alice Johnson')).toBeInTheDocument();
      expect(within(dialog).getByText('Software Engineer')).toBeInTheDocument();
    });

    it('closes the dialog and reloads when Cancel is clicked', async () => {
      mockApi([REVIEW_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
      // load() is called once on mount and once on close
      expect(getEvaluationsForManager).toHaveBeenCalledTimes(2);
    });
  });

  // ── Feedback tab ───────────────────────────────────────────────────────────

  describe('feedback tab', () => {
    it('renders evaluation items with name and description', async () => {
      mockApi([REVIEW_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));

      expect(screen.getByText('Communication')).toBeInTheDocument();
      expect(
        screen.getByText('Clarity and effectiveness of communication'),
      ).toBeInTheDocument();
    });

    it('shows "No evaluation criteria" when evaluationItems is empty', async () => {
      mockApi([{ ...REVIEW_EVALUATION, evaluationItems: [] }]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));

      expect(
        screen.getByText('No evaluation criteria available for this evaluation.'),
      ).toBeInTheDocument();
    });

    it('Submit button is disabled when no rating and no feedback', async () => {
      mockApi([REVIEW_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));

      expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
    });

    it('Submit button is disabled when rated but no feedback', async () => {
      mockApi([REVIEW_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));

      // Click the 4th star
      const stars = screen.getAllByRole('button').filter((b) =>
        b.querySelector('svg'),
      );
      await user.click(stars[3]);

      expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
    });

    it('Submit button is disabled when feedback given but no rating', async () => {
      mockApi([REVIEW_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));

      await user.type(
        screen.getByPlaceholderText('Add your comments...'),
        'Great work',
      );

      expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
    });

    it('Submit button is enabled when all items have rating and feedback', async () => {
      mockApi([REVIEW_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));

      // Rate: click 4th star (rating = 4)
      const starButtons = screen
        .getAllByRole('button')
        .filter((b) => b.querySelector('svg.lucide-star'));
      await user.click(starButtons[3]);

      // Comment
      await user.type(
        screen.getByPlaceholderText('Add your comments...'),
        'Great work',
      );

      expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();
    });
  });

  // ── Goal record tab ────────────────────────────────────────────────────────

  describe('goal record tab', () => {
    it('switches to Goal Record tab and shows goal details', async () => {
      mockApi([REVIEW_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));
      await user.click(screen.getByRole('tab', { name: /goal records/i }));

      expect(screen.getByText('Ship new onboarding flow')).toBeInTheDocument();
      expect(screen.getByText('Improves user retention')).toBeInTheDocument();
      expect(screen.getByText('Completion rate ≥ 80%')).toBeInTheDocument();
      expect(screen.getByText('2025-06-30')).toBeInTheDocument();
    });

    it('does not show "View Progress" button when goal has no progresses', async () => {
      mockApi([REVIEW_EVALUATION]); // progresses: []
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));
      await user.click(screen.getByRole('tab', { name: /goal records/i }));

      expect(screen.queryByRole('button', { name: /view progress/i })).not.toBeInTheDocument();
    });

    it('shows "View Progress" button when goal has progresses', async () => {
      const evalWithProgress = {
        ...REVIEW_EVALUATION,
        goals: [
          {
            ...REVIEW_EVALUATION.goals[0],
            progresses: [{ "timestamp": 1, "description": 'Half done' }],
          },
        ],
      };
      mockApi([evalWithProgress]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));
      await user.click(screen.getByRole('tab', { name: /goal records/i }));

      expect(screen.getByRole('button', { name: /view progress/i })).toBeInTheDocument();
    });
  });

  // ── Save action ────────────────────────────────────────────────────────────

  describe('save action', () => {
    it('calls draftReview with the correct id and items', async () => {
      mockApi([REVIEW_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));
      await user.click(screen.getByRole('button', { name: /^save$/i }));

      expect(draftReview).toHaveBeenCalledWith(
        REVIEW_EVALUATION.id,
        REVIEW_EVALUATION.evaluationItems,
      );
    });

    it('shows a success alert after saving', async () => {
      mockApi([REVIEW_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));
      await user.click(screen.getByRole('button', { name: /^save$/i }));

      await waitFor(() =>
        expect(screen.getByText('You have saved the feedback.')).toBeInTheDocument(),
      );
    });

    it('shows a failure alert when draftReview throws', async () => {
      vi.mocked(draftReview).mockRejectedValue(new Error('Server error'));
      mockApi([REVIEW_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));
      await user.click(screen.getByRole('button', { name: /^save$/i }));

      await waitFor(() =>
        expect(screen.getByText('Failed to save the feedback. Please try again.')).toBeInTheDocument(),
      );
    });

    it('does not close the dialog after saving', async () => {
      mockApi([REVIEW_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));
      await user.click(screen.getByRole('button', { name: /^save$/i }));

      await waitFor(() =>
        expect(screen.getByText('You have saved the feedback.')).toBeInTheDocument(),
      );
      await dismissNotification(user);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('check saved data after dialog closed', async () => {
      const evalWithFeedback = {
        ...REVIEW_EVALUATION,
        evaluationItems: [
          {
            ...EVALUATION_ITEM,
            feedback: 'Great work',
          },
        ],
      };
      
      mockApi([REVIEW_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));
      await user.type(
        screen.getByPlaceholderText('Add your comments...'),
        'Great work',
      );
      await user.click(screen.getByRole('button', { name: /^save$/i }));
      await dismissNotification(user);
      
      // Mock the updated evaluation data for the second load
      mockApi([evalWithFeedback]);
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      await user.click(screen.getByText('Alice Johnson'));
      expect(screen.getByText('Great work')).toBeInTheDocument();
    });
  });

  // ── Submit action ──────────────────────────────────────────────────────────

  describe('submit action', () => {
    // Helper: open dialog, fill in rating + feedback, then return user
    async function openAndFillDialog() {
      mockApi([REVIEW_EVALUATION]);
      const user = await renderAndWait();

      await user.click(screen.getByText('Alice Johnson'));

      const starButtons = screen
        .getAllByRole('button')
        .filter((b) => b.querySelector('svg.lucide-star'));
      await user.click(starButtons[4]); // 5 stars

      await user.type(
        screen.getByPlaceholderText('Add your comments...'),
        'Excellent',
      );

      return user;
    }

    it('calls draftReview then submitReview with the correct id', async () => {
      const user = await openAndFillDialog();

      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => expect(submitReview).toHaveBeenCalledWith(REVIEW_EVALUATION.id));
      expect(draftReview).toHaveBeenCalled();
    });

    it('reloads the list after submitting', async () => {
      const user = await openAndFillDialog();

      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() =>
        expect(getEvaluationsForManager).toHaveBeenCalled(),
      );
      await dismissNotification(user);
      // After submit, the dialog should be closed and list reloaded
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes the dialog after submitting', async () => {
      const user = await openAndFillDialog();

      await user.click(screen.getByRole('button', { name: /submit/i }));

      await dismissNotification(user);
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
    });

    it('shows a success alert after submitting', async () => {
      const user = await openAndFillDialog();

      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() =>
        expect(screen.getByText('You have submitted the feedback.')).toBeInTheDocument(),
      );
    });

    it('shows a failure alert when submitReview throws', async () => {
      vi.mocked(submitReview).mockRejectedValue(new Error('Server error'));
      const user = await openAndFillDialog();

      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() =>
        expect(screen.getByText('Failed to submit the feedback. Please try again.')).toBeInTheDocument(),
      );
    });
  });

  describe('search and filters', () => {
  
    it('filters rows by employee name', async () => {
        mockApi([REVIEW_EVALUATION, SECOND_EVALUATION]);
        const user = await renderAndWait();

        await user.type(screen.getByPlaceholderText('Type employee name...'), 'Alice');

        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.queryByText('Carol White')).not.toBeInTheDocument();
    });

    it('filters rows by job title', async () => {
        mockApi([REVIEW_EVALUATION, SECOND_EVALUATION]);
        const user = await renderAndWait();

        const jobSelects = screen.getAllByRole('combobox');
        await user.selectOptions(jobSelects[0], 'Designer');

        expect(screen.getByText('Carol White')).toBeInTheDocument();
        expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });

    it('filters rows by cycle type', async () => {
        mockApi([REVIEW_EVALUATION, SECOND_EVALUATION]);
        const user = await renderAndWait();
        
        const cycleSelects = screen.getAllByRole('combobox');
        await user.selectOptions(cycleSelects[1], 'Quarter');

        expect(screen.getByText('Carol White')).toBeInTheDocument();
        expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });

    it('clears search to show all rows again', async () => {
        mockApi([REVIEW_EVALUATION, SECOND_EVALUATION]);
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
        mockApi([REVIEW_EVALUATION, SECOND_EVALUATION]);
        const user = await renderAndWait();

        await user.type(screen.getByPlaceholderText('Type employee name...'), 'alice');

        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.queryByText('Carol White')).not.toBeInTheDocument();
    });
});
  
});
