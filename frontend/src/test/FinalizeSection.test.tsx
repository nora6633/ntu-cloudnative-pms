import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FinalizeSection } from '../app/sections/FinalizeSection';
import { getEvaluationsForHr, approveEvaluation, rejectEvaluation } from '../api';

vi.mock('../api', () => ({
  getEvaluationsForHr: vi.fn(),
  approveEvaluation: vi.fn(),
  rejectEvaluation: vi.fn(),
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

async function dismissNotification(user: ReturnType<typeof userEvent.setup>) {
  const okButton = await screen.findByRole('button', { name: /ok/i });
  await user.click(okButton);
}

const EVALUATION_ITEM = {
  id: 201,
  name: 'Communication',
  description: 'Clarity and effectiveness of communication',
  rating: 4,
  feedback: 'Great Work',
};


const PENDING_CLOSURE = {
  id: 1,
  employeeName: 'Alice Johnson',
  employeeJobTitle: 'Software Engineer',
  type: 'Annual',
  status: 'PENDING_CLOSURE',
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
  evaluationItems: [EVALUATION_ITEM],
};

const SECOND_PENDING_CLOSURE = {
    id: 3,
    employeeName: 'Carol White',
    employeeJobTitle: 'Designer',
    type: 'Quarter',
    status: 'PENDING_CLOSURE',
    goals: [],
    evaluationItems: [EVALUATION_ITEM],
};

const NON_PENDING_CLOSURE = {
  id: 2,
  employeeName: 'Bob Smith',
  employeeJobTitle: 'Product Manager',
  type: 'Quarter',
  status: 'PENDING_GOAL_APPROVAL',
  evaluationItems: [],
  goals: [],
};

function mockApiWithContent(evaluations: typeof PENDING_CLOSURE[]) {
  vi.mocked(getEvaluationsForHr).mockResolvedValue({
    data: { content: evaluations },
  } as any);
}

async function renderAndWait() {
  const user = userEvent.setup();
  render(<FinalizeSection />);
  // Wait until the loading spinner disappears
  await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
  return user;
}

describe('FinalizeSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(approveEvaluation).mockResolvedValue({} as any);
        vi.mocked(rejectEvaluation).mockResolvedValue({} as any);
    });
    //── Loading / error states ─────────────────────────────────────────────────
    describe('loading state', () => {
        it('shows a loading indicator while fetching', () => {
          // Never resolve so we stay in loading
          vi.mocked(getEvaluationsForHr).mockReturnValue(new Promise(() => {}));
          render(<FinalizeSection />);
          expect(screen.getByText('Loading…')).toBeInTheDocument();
        });
    });
    
    describe('error state', () => {
        it('shows an error message when the API call fails', async () => {
          vi.mocked(getEvaluationsForHr).mockRejectedValue(new Error('Network error'));
          render(<FinalizeSection />);
          await waitFor(() =>
            expect(screen.getByText('Failed to load evaluations.')).toBeInTheDocument(),
          );
        });
    });

    // ── Data rendering ─────────────────────────────────────────────────────────

    describe('data rendering', () => {
        it('renders only PENDING_GOAL_APPROVAL evaluations', async () => {
          mockApiWithContent([PENDING_CLOSURE, NON_PENDING_CLOSURE]);
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
          mockApiWithContent([PENDING_CLOSURE, SECOND_PENDING_CLOSURE]);
          await renderAndWait();
    
          const table = screen.getByRole('table');
          expect(within(table).getByText('Software Engineer')).toBeInTheDocument();
          expect(within(table).getByText('Annual')).toBeInTheDocument();
          expect(within(table).getByText('Designer')).toBeInTheDocument();
          expect(within(table).getByText('Quarter')).toBeInTheDocument();
        });
    
        it('does not render a Status column (hideStatus = true)', async () => {
          mockApiWithContent([PENDING_CLOSURE]);
          await renderAndWait();
    
          expect(screen.queryByText('Status')).not.toBeInTheDocument();
          expect(screen.queryByText('Pending Closure')).not.toBeInTheDocument();
        });
    });

    // ── Dialog open / close ────────────────────────────────────────────────────

    describe('dialog open/close', () => {
        it('opens the dialog when a row is clicked', async () => {
            mockApiWithContent([PENDING_CLOSURE]);
            const user = await renderAndWait();
    
            await user.click(screen.getByText('Alice Johnson'));
    
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('shows employee name and job title in the dialog header', async () => {
              mockApiWithContent([PENDING_CLOSURE]);
              const user = await renderAndWait();
        
              await user.click(screen.getByText('Alice Johnson'));
        
              const dialog = screen.getByRole('dialog');
              expect(within(dialog).getByText('Alice Johnson')).toBeInTheDocument();
              expect(within(dialog).getByText('Software Engineer')).toBeInTheDocument();
        });
        
        it('closes the dialog when Cancel is clicked', async () => {
              mockApiWithContent([PENDING_CLOSURE]);
              const user = await renderAndWait();
        
              await user.click(screen.getByText('Alice Johnson'));
              await user.click(screen.getByRole('button', { name: /cancel/i }));
        
              await waitFor(() =>
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
              );
        });

        it('renders evaluation items with name and description', async () => {
              mockApiWithContent([PENDING_CLOSURE]);
              const user = await renderAndWait();
        
              await user.click(screen.getByText('Alice Johnson'));
        
              expect(screen.getByText('Communication')).toBeInTheDocument();
              expect(
                screen.getByText('Clarity and effectiveness of communication'),
              ).toBeInTheDocument();
        });
        
        it('shows "No evaluation criteria" when evaluationItems is empty', async () => {
              mockApiWithContent([{ ...PENDING_CLOSURE, evaluationItems: [] }]);
              const user = await renderAndWait();
        
              await user.click(screen.getByText('Alice Johnson'));
        
              expect(
                screen.getByText('No ratings available.'),
              ).toBeInTheDocument();
        });

        it('switches to Goal Record tab and shows goal details', async () => {
              mockApiWithContent([PENDING_CLOSURE]);
              const user = await renderAndWait();
        
              await user.click(screen.getByText('Alice Johnson'));
              await user.click(screen.getByRole('tab', { name: /goal records/i }));
        
              expect(screen.getByText('Ship new onboarding flow')).toBeInTheDocument();
              expect(screen.getByText('Improves user retention')).toBeInTheDocument();
              expect(screen.getByText('2025-06-30')).toBeInTheDocument();
        });

        it('does not show "View Progress" button when goal has no progresses', async () => {
              mockApiWithContent([PENDING_CLOSURE]); // progresses: []
              const user = await renderAndWait();
        
              await user.click(screen.getByText('Alice Johnson'));
              await user.click(screen.getByRole('tab', { name: /goal records/i }));
        
              expect(screen.queryByRole('button', { name: /view progress/i })).not.toBeInTheDocument();
            });
        
        it('shows "View Progress" button when goal has progresses', async () => {
            const evalWithProgress = {
            ...PENDING_CLOSURE,
            goals: [
                {
                ...PENDING_CLOSURE.goals[0],
                progresses: [{ "timestamp": 1, "description": 'Half done' }],
                },
            ],
            };
            mockApiWithContent([evalWithProgress]);
            const user = await renderAndWait();
    
            await user.click(screen.getByText('Alice Johnson'));
            await user.click(screen.getByRole('tab', { name: /goal records/i }));
    
            expect(screen.getByRole('button', { name: /view progress/i })).toBeInTheDocument();
        });
    });

    // ── Approve flow ───────────────────────────────────────────────────────────

    describe('approve action', () => {
        it('calls approveGoals with the correct id', async () => {
          mockApiWithContent([PENDING_CLOSURE]);
          const user = await renderAndWait();
    
          await user.click(screen.getByText('Alice Johnson'));
          await user.click(screen.getByRole('button', { name: /approve/i }));
    
          expect(approveEvaluation).toHaveBeenCalledWith(PENDING_CLOSURE.id);
          expect(screen.getByText('You have approved the feedback')).toBeInTheDocument();
        });
    
        it('closes the dialog after approving', async () => {
          mockApiWithContent([PENDING_CLOSURE]);
          const user = await renderAndWait();
    
          await user.click(screen.getByText('Alice Johnson'));
          await user.click(screen.getByRole('button', { name: /approve/i }));
  
          await dismissNotification(user);
          await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
          );
        });
    
        it('reloads the list after approving (removes the row)', async () => {
          mockApiWithContent([PENDING_CLOSURE]);
          const user = await renderAndWait();
    
          await user.click(screen.getByText('Alice Johnson'));
          await user.click(screen.getByRole('button', { name: /approve/i }));
          await dismissNotification(user);
    
          await waitFor(() =>
            expect(getEvaluationsForHr).toHaveBeenCalledTimes(2),
          );
        });
      });
    
      // ── Reject flow ────────────────────────────────────────────────────────────
    
      describe('reject action', () => {
        it('calls rejectGoals with the correct id', async () => {
          mockApiWithContent([PENDING_CLOSURE]);
          const user = await renderAndWait();
    
          await user.click(screen.getByText('Alice Johnson'));
          await user.click(screen.getByRole('button', { name: /reject/i }));
    
          expect(rejectEvaluation).toHaveBeenCalledWith(PENDING_CLOSURE.id);
          expect(screen.getByText('You have rejected the feedback')).toBeInTheDocument();
        });
    
        it('closes the dialog after rejecting', async () => {
          mockApiWithContent([PENDING_CLOSURE]);
          const user = await renderAndWait();
    
          await user.click(screen.getByText('Alice Johnson'));
          await user.click(screen.getByRole('button', { name: /reject/i }));
          await dismissNotification(user);
    
          await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
          );
        });
    
        it('reloads the list after rejecting (removes the row)', async () => {
          mockApiWithContent([PENDING_CLOSURE]);
          const user = await renderAndWait();
    
    
          await user.click(screen.getByText('Alice Johnson'));
          await user.click(screen.getByRole('button', { name: /reject/i }));
          await dismissNotification(user);
    
          await waitFor(() =>
            expect(getEvaluationsForHr).toHaveBeenCalledTimes(2),
          );
        });
      });
    
      // ── Filter / search ────────────────────────────────────────────────────────
    
      describe('search and filters', () => {
    
        it('filters rows by employee name', async () => {
          mockApiWithContent([PENDING_CLOSURE, SECOND_PENDING_CLOSURE]);
          const user = await renderAndWait();
    
          await user.type(screen.getByPlaceholderText('Type employee name...'), 'Alice');
    
          expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
          expect(screen.queryByText('Carol White')).not.toBeInTheDocument();
        });
    
        it('clears search to show all rows again', async () => {
          mockApiWithContent([PENDING_CLOSURE, SECOND_PENDING_CLOSURE]);
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
          mockApiWithContent([PENDING_CLOSURE, SECOND_PENDING_CLOSURE]);
          const user = await renderAndWait();
    
          await user.type(screen.getByPlaceholderText('Type employee name...'), 'alice');
    
          expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
          expect(screen.queryByText('Carol White')).not.toBeInTheDocument();
        });
    
        it('filters rows by job title', async () => {
          mockApiWithContent([PENDING_CLOSURE, SECOND_PENDING_CLOSURE]);
          const user = await renderAndWait();
    
          const jobSelects = screen.getAllByRole('combobox');
          await user.selectOptions(jobSelects[0], 'Designer');
    
          expect(screen.getByText('Carol White')).toBeInTheDocument();
          expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
        });
    
        it('filters rows by cycle type', async () => {
          mockApiWithContent([PENDING_CLOSURE, SECOND_PENDING_CLOSURE]);
          const user = await renderAndWait();
          
          const cycleSelects = screen.getAllByRole('combobox');
          await user.selectOptions(cycleSelects[1], 'Quarter');
    
          expect(screen.getByText('Carol White')).toBeInTheDocument();
          expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
        });
    });
});