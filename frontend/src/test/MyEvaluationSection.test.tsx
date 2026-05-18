import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyEvaluationSection } from '../app/sections/MyEvaluationSection';
import * as api from '../api';

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('../api', () => ({
  getMyEvaluations: vi.fn(),
  draftGoals: vi.fn(),
  submitForGoalApproval: vi.fn(),
  submitForProgressReview: vi.fn(),
  approveReview: vi.fn(),
  rejectReview: vi.fn(),
  addProgress: vi.fn(),
}));

const mockApi = api as { [K in keyof typeof api]: ReturnType<typeof vi.fn> };

// Stub child dialogs that are not under test
vi.mock('../app/components/EvaluationCriteriaDialog', () => ({
  EvaluationCriteriaDialog: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="criteria-dialog"><button onClick={onClose}>Close Criteria</button></div> : null,
}));

// ── Fixtures ───────────────────────────────────────────────────────────────

const CRITERIA = [
  { id: 1, name: 'Communication', description: 'Comm skills', rating: 0, feedback: '' },
  { id: 2, name: 'Delivery', description: 'Delivers results', rating: 0, feedback: '' },
];

const GOAL_NO_PROGRESS: {
  id: number;
  definition: string;
  metric: string;
  deadline: string;
  relevance: string;
  resource: string;
  criteria: string[];
  progresses: { description: string; timestamp: string }[];
} = {
  id: 10,
  definition: 'Learn TypeScript',
  metric: 'Course completion',
  deadline: '2025-12-31',
  relevance: 'Improves code quality',
  resource: 'Online license',
  criteria: ['Communication'],
  progresses: [],
};

const GOAL_WITH_PROGRESS = {
  ...GOAL_NO_PROGRESS,
  id: 11,
  definition: 'Complete Q3 project',
  progresses: [
    { description: 'Started design phase', timestamp: '2025-06-01T10:00:00.000Z' },
    { description: 'Finished implementation', timestamp: '2025-07-15T14:00:00.000Z' },
  ],
};

function makeEval(status: string, goals: typeof GOAL_NO_PROGRESS[] = [], extraItems = CRITERIA) {
  return {
    id: 99,
    type: 'ANNUAL',
    status,
    employeeJobTitle: 'Engineer',
    evaluationItems: extraItems,
    goals,
  };
}

function setup(evaluation: object | null) {
  mockApi.getMyEvaluations.mockResolvedValue({
    data: { content: evaluation ? [evaluation] : [] },
  } as any);
  return render(<MyEvaluationSection />);
}

// ── Loading & Error ────────────────────────────────────────────────────────

describe('Loading and error states', () => {
  it('shows loading indicator while fetching', () => {
    mockApi.getMyEvaluations.mockReturnValue(new Promise(() => {})); // never resolves
    render(<MyEvaluationSection />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    mockApi.getMyEvaluations.mockRejectedValue(new Error('Network error'));
    render(<MyEvaluationSection />);
    await waitFor(() =>
      expect(screen.getByText(/Failed to load evaluations/i)).toBeInTheDocument(),
    );
  });

  it('shows empty state when no evaluation exists for the selected tab', async () => {
    mockApi.getMyEvaluations.mockResolvedValue({ data: { content: [] } } as any);
    render(<MyEvaluationSection />);
    await waitFor(() =>
      expect(screen.getByText(/No active evaluation for this cycle/i)).toBeInTheDocument(),
    );
  });
});

// ── Tab navigation ─────────────────────────────────────────────────────────

describe('Tab navigation', () => {
  it('renders Annual, Quarter, Probation tabs', async () => {
    setup(null);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Annual' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Quarter' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Probation' })).toBeInTheDocument();
    });
  });

  it('switches to Quarter tab on click', async () => {
    mockApi.getMyEvaluations.mockResolvedValue({
      data: {
        content: [
          makeEval('INITIAL'),                           // ANNUAL
          { ...makeEval('WORKING'), type: 'QUARTER' },   // QUARTER
        ],
      },
    } as any);
    render(<MyEvaluationSection />);
    await waitFor(() => screen.getByText(/Status:/i));

    fireEvent.click(screen.getByRole('button', { name: 'Quarter' }));
    await waitFor(() => expect(screen.getByText(/Working/i)).toBeInTheDocument());
  });
});

// ── Criteria dialog ────────────────────────────────────────────────────────

describe('Criteria dialog', () => {
  it('opens criteria dialog when the criteria icon button is clicked', async () => {
    setup(makeEval('INITIAL'));
    await waitFor(() => screen.getByText(/Status:/i));

    const iconButtons = screen.getAllByRole('button');
    const criteriaButton = iconButtons.find(
      (btn) => btn.querySelector('svg') && !btn.textContent?.trim(),
    )!;
    fireEvent.click(criteriaButton);
    expect(screen.getByTestId('criteria-dialog')).toBeInTheDocument();
  });
});

// ── Initial status ─────────────────────────────────────────────────────────

describe('Initial status', () => {
  beforeEach(() => {
    mockApi.draftGoals.mockResolvedValue({} as any);
    mockApi.submitForGoalApproval.mockResolvedValue({} as any);
  });

  it('render initial page components', async () => {
    setup(makeEval('INITIAL'));
    await waitFor(() => {
      expect(screen.getByText(/Status: Initial/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Draft Goals/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Submit$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /New Goal/i })).toBeInTheDocument();
    });
  });

  it('opens goal creation dialog when "New Goal" is clicked', async () => {
    setup(makeEval('INITIAL'));
    await waitFor(() => screen.getByRole('button', { name: /New Goal/i }));
    fireEvent.click(screen.getByRole('button', { name: /New Goal/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/New Goal/i, { selector: '[role="dialog"] *' })).toBeInTheDocument();
  });

  it('"Add Goal" button enables only after all fields are filled', async () => {
    const user = userEvent.setup();
    setup(makeEval('INITIAL', [], CRITERIA));
    await waitFor(() => screen.getByRole('button', { name: /New Goal/i }));
    await user.click(screen.getByRole('button', { name: /New Goal/i }));
    await screen.findByRole('dialog');

    const addBtn = screen.getByRole('button', { name: /Add Goal/i });
    expect(addBtn).toBeDisabled()

    await user.type(screen.getByLabelText(/Goal Statement/i), 'My new goal');
    await user.type(screen.getByLabelText(/Metric/i), 'Course completion');
    fireEvent.change(screen.getByLabelText(/Deadline/i), { target: { value: '2099-12-31' } });
    await user.type(screen.getByLabelText(/Relevance/i), 'Very relevant');
    await user.type(screen.getByLabelText(/Required Resources/i), 'License');
    // select a criteria tag
    await user.click(screen.getByRole('button', { name: 'Communication' }));

    expect(screen.getByRole('button', { name: /Add Goal/i })).not.toBeDisabled();
  });

  it('adds a goal to the list after submitting the dialog', async () => {
    const user = userEvent.setup();
    setup(makeEval('INITIAL', [], CRITERIA));
    await waitFor(() => screen.getByRole('button', { name: /New Goal/i }));
    await user.click(screen.getByRole('button', { name: /New Goal/i }));
    await screen.findByRole('dialog');

    await user.type(screen.getByLabelText(/Goal Statement/i), 'Brand new goal');
    await user.type(screen.getByLabelText(/Metric/i), 'Units shipped');
    fireEvent.change(screen.getByLabelText(/Deadline/i), { target: { value: '2099-12-31' } });
    await user.type(screen.getByLabelText(/Relevance/i), 'Core KPI');
    await user.type(screen.getByLabelText(/Required Resources/i), 'Budget');
    await user.click(screen.getByRole('button', { name: 'Communication' }));
    await user.click(screen.getByRole('button', { name: /Add Goal/i }));

    await waitFor(() => expect(screen.getByText('Brand new goal')).toBeInTheDocument());
  });

  it('shows update and delete buttons on each goal card', async () => {
    setup(makeEval('INITIAL', [GOAL_NO_PROGRESS]));
    await waitFor(() => screen.getByText('Learn TypeScript'));
    expect(screen.getByRole('button', { name: /Update/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
  });

  it('removes a goal when Delete is clicked', async () => {
    setup(makeEval('INITIAL', [GOAL_NO_PROGRESS]));
    await waitFor(() => screen.getByText('Learn TypeScript'));
    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
    await waitFor(() =>
      expect(screen.queryByText('Learn TypeScript')).not.toBeInTheDocument(),
    );
  });

  it('opens edit dialog when Update is clicked', async () => {
    setup(makeEval('INITIAL', [GOAL_NO_PROGRESS]));
    await waitFor(() => screen.getByText('Learn TypeScript'));
    fireEvent.click(screen.getByRole('button', { name: /Update/i }));
    await screen.findByRole('dialog');
    expect(screen.getByText(/Update Goal/i, { selector: '[role="dialog"] *' })).toBeInTheDocument();
  });

  it('shows success notification after clicking Submit', async () => {
    setup(makeEval('INITIAL', [GOAL_NO_PROGRESS]));
    await waitFor(() => screen.getByRole('button', { name: /^Submit$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Submit$/i }));
    await waitFor(() =>
      expect(screen.getByText('Your goals have been submitted for approval.')).toBeInTheDocument,
    );
  });
});

// ── Pending_goal_approval (Review goal) ────────────────────────────────────

describe('Review goal status', () => {
  it('render correct information', async () => {
    setup(makeEval('PENDING_GOAL_APPROVAL', [GOAL_NO_PROGRESS]));
    await waitFor(() =>{
      expect(screen.getByText(/Status: Pending Goal Approval/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Your goals have been submitted and are awaiting approval/i),
      ).toBeInTheDocument();
      expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
    }
    );
  });

  it('read-only, does NOT show buttons', async () => {
    setup(makeEval('PENDING_GOAL_APPROVAL', [GOAL_NO_PROGRESS]));
    await waitFor(() => screen.getByText(/Pending Goal Approval/i));
    expect(screen.queryByRole('button', { name: /New Goal/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Draft Goals/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Submit$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Update/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
  });
});

// ── Working status ─────────────────────────────────────────────────────────

describe('Working status', () => {
  beforeEach(() => {
    mockApi.addProgress.mockResolvedValue({} as any);
    mockApi.submitForProgressReview.mockResolvedValue({} as any);
  });

  it('shows "Status: Working" in the header', async () => {
    setup(makeEval('WORKING', [GOAL_NO_PROGRESS]));
    await waitFor(() => {
      expect(screen.getByText(/Status: Working/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Submit for Review/i })).toBeInTheDocument();
    });
  });

  it('does NOT show MessageSquare icon when a goal has no progress', async () => {
    setup(makeEval('WORKING', [GOAL_NO_PROGRESS]));
    await waitFor(() => screen.getByText('Learn TypeScript'));
    // The latest-progress block should be absent
    expect(screen.queryByText(/Latest update/i)).not.toBeInTheDocument();
    // The description that would appear inside the progress block is also absent
    expect(screen.queryByTestId('progress-block')).not.toBeInTheDocument();
  });

  it('shows "Add Progress" button for each goal', async () => {
    setup(makeEval('WORKING', [GOAL_NO_PROGRESS]));
    await waitFor(() => screen.getByText('Learn TypeScript'));
    expect(screen.getByRole('button', { name: /Add Progress/i })).toBeInTheDocument();
  });

  it('opens the progress dialog when "Add Progress" is clicked', async () => {
    setup(makeEval('WORKING', [GOAL_NO_PROGRESS]));
    await waitFor(() => screen.getByRole('button', { name: /Add Progress/i }));
    fireEvent.click(screen.getByRole('button', { name: /Add Progress/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Add Progress Update/i)).toBeInTheDocument();
  });

  it('shows the latest progress entry after adding progress', async () => {
    const user = userEvent.setup();
    setup(makeEval('WORKING', [{ ...GOAL_NO_PROGRESS, id: 10 }]));
    await waitFor(() => screen.getByRole('button', { name: /Add Progress/i }));
    await user.click(screen.getByRole('button', { name: /Add Progress/i }));
    await screen.findByRole('dialog');
    await user.type(
      screen.getByPlaceholderText(/Describe what you accomplished/i),
      'Completed chapter 1',
    );
    await user.click(screen.getByRole('button', { name: /Add Update/i }));
    // wait for dialog to close and notification to appear (or text to appear)
    await waitFor(() =>
      expect(screen.getByText('Completed chapter 1')).toBeInTheDocument(),
    );
  });

  it('"View Details" opens the goal details dialog and contains all progress log', async () => {
    setup(makeEval('WORKING', [GOAL_WITH_PROGRESS]));
    await waitFor(() => screen.getAllByRole('button', { name: /View Details/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /View Details/i })[0]);
    const dialog = await screen.findByRole('dialog');
    // details dialog should show the goal title
    expect(within(dialog).getByText('Complete Q3 project')).toBeInTheDocument();
    expect(within(dialog).getByText('Started design phase')).toBeInTheDocument();
    expect(within(dialog).getByText('Finished implementation')).toBeInTheDocument();
  });

  it('shows success notification after clicking "Submit for Review"', async () => {
    setup(makeEval('WORKING', [GOAL_NO_PROGRESS]));
    await waitFor(() => screen.getByRole('button', { name: /Submit for Review/i }));
    fireEvent.click(screen.getByRole('button', { name: /Submit for Review/i }));
    await waitFor(() =>
      expect(screen.getByText('Your evaluation has been submitted for manager review.')).toBeInTheDocument,
    );
  });
});

// ── Review status ──────────────────────────────────────────────────────────

describe('Review status', () => {
  it('render review page correctly', async () => {
    setup(makeEval('REVIEW', [GOAL_WITH_PROGRESS]));
    await waitFor(() =>{
      expect(screen.getByText(/Status: Awaiting Review/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Your manager is reviewing your goals and progress/i),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /View Details/i })).toBeInTheDocument();
    }
    );
  });


  it('read-only, does NOT show buttons', async () => {
    setup(makeEval('REVIEW', [GOAL_WITH_PROGRESS]));
    await waitFor(() => screen.getByText(/Awaiting Review/i));
    expect(
      screen.queryByRole('button', { name: /Submit for Review/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add Progress/i })).not.toBeInTheDocument();
  });

  it('View Details shows goal information', async () => {
    setup(makeEval('REVIEW', [GOAL_WITH_PROGRESS]));
    await waitFor(() => screen.getByRole('button', { name: /View Details/i }));
    fireEvent.click(screen.getByRole('button', { name: /View Details/i }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Complete Q3 project')).toBeInTheDocument();
    expect(within(dialog).getByText('Finished implementation')).toBeInTheDocument();
  });
});

// ── Confirming status ──────────────────────────────────────────────────────

describe('Confirming status', () => {
  const ratedItems = [
    { ...CRITERIA[0], rating: 4, feedback: 'Great communicator' },
    { ...CRITERIA[1], rating: 3, feedback: 'On track' },
  ];

  beforeEach(() => {
    mockApi.approveReview.mockResolvedValue({} as any);
    mockApi.rejectReview.mockResolvedValue({} as any);
  });

  it('render Confirm page correctly', async () => {
    setup(makeEval('PENDING_REVIEW_CONFIRMATION', [], ratedItems));
    await waitFor(() =>{
      expect(screen.getByText(/Status: Confirming/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Request Revision/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Confirm$/i })).toBeInTheDocument();
    });
  });

  it('shows "Requesting…" label while Request Revision is in-flight', async () => {
    mockApi.rejectReview.mockReturnValue(new Promise(() => {})); // never resolves
    setup(makeEval('PENDING_REVIEW_CONFIRMATION', [], ratedItems));
    await waitFor(() => screen.getByRole('button', { name: /Request Revision/i }));
    fireEvent.click(screen.getByRole('button', { name: /Request Revision/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Requesting…/i })).toBeInTheDocument(),
    );
  });

  it('shows "Confirming…" label while Confirm is in-flight', async () => {
    mockApi.approveReview.mockReturnValue(new Promise(() => {})); // never resolves
    setup(makeEval('PENDING_REVIEW_CONFIRMATION', [], ratedItems));
    await waitFor(() => screen.getByRole('button', { name: /^Confirm$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Confirm$/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Confirming…/i })).toBeInTheDocument(),
    );
  });

  it('shows success notification after confirming', async () => {
    setup(makeEval('PENDING_REVIEW_CONFIRMATION', [], ratedItems));
    await waitFor(() => screen.getByRole('button', { name: /^Confirm$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Confirm$/i }));
    await waitFor(() =>
      expect(screen.getByText('You have confirmed the review.')).toBeInTheDocument,
    );
  });

  it('shows success notification after requesting revision', async () => {
    setup(makeEval('PENDING_REVIEW_CONFIRMATION', [], ratedItems));
    await waitFor(() => screen.getByRole('button', { name: /Request Revision/i }));
    fireEvent.click(screen.getByRole('button', { name: /Request Revision/i }));
    await waitFor(() =>
      expect(screen.getByText('You have requested a revision. Your manager will be notified.')).toBeInTheDocument,
    );
  });

  it('displays evaluation items with feedback', async () => {
    setup(makeEval('PENDING_REVIEW_CONFIRMATION', [], ratedItems));
    await waitFor(() => screen.getByText('Great communicator'));
    expect(screen.getByText('On track')).toBeInTheDocument();
  });
});

// ── Pending_Closure status ─────────────────────────────────────────────────

describe('Pending_Closure status', () => {
  const ratedItems = [
    { ...CRITERIA[0], rating: 5, feedback: 'Excellent' },
  ];

  it('shows "Status: Pending Closure" in the header', async () => {
    setup(makeEval('PENDING_CLOSURE', [], ratedItems));
    await waitFor(() =>
      expect(screen.getByText(/Status: Pending Closure/i)).toBeInTheDocument(),
    );
  });

  it('does NOT show Request Revision or Confirm buttons', async () => {
    setup(makeEval('PENDING_CLOSURE', [], ratedItems));
    await waitFor(() => screen.getByText(/Pending Closure/i));
    expect(screen.queryByRole('button', { name: /Request Revision/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Confirm$/i })).not.toBeInTheDocument();
  });

  it('shows evaluation items in read-only mode', async () => {
    setup(makeEval('PENDING_CLOSURE', [], ratedItems));
    await waitFor(() => expect(screen.getByText('Excellent')).toBeInTheDocument());
  });
});

// ── Closed status ──────────────────────────────────────────────────────────

describe('Closed status (no page shown)', () => {
  it('does not render closed evaluation', async () => {
    // CLOSED evals are filtered out by currentEval selector (status !== CLOSED)
    mockApi.getMyEvaluations.mockResolvedValue({
      data: { content: [makeEval('CLOSED')] },
    } as any);
    render(<MyEvaluationSection />);
    await waitFor(() => screen.getByText(/No active evaluation for this cycle/i));
    expect(screen.queryByText(/Status: Closed/i)).not.toBeInTheDocument();
  });
});