import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { HistorySection } from '../app/sections/HistorySection';
import { getMyEvaluations } from '../api';

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('../api', () => ({
  getMyEvaluations: vi.fn(),
}));


// ── Fixtures ───────────────────────────────────────────────────────────────

const makeEvaluation = (overrides = {}) => ({
  id: '1',
  type: 'ANNUAL',
  status: 'CLOSED',
  cycle: '2024',
  evaluationItems: [
    {
      id: '1',
      name: 'Communication',
      description: 'How well you communicate',
      rating: 4,
      feedback: 'Great communicator',
    },
    {
      id: '2',
      name: 'Teamwork',
      description: 'Collaboration skills',
      rating: 5,
      feedback: 'Excellent team player',
    },
  ],
  goals: [
    {
      id: '1',
      definition: 'Improve public speaking',
      relevance: 'Needed for leadership track',
      metric: '3 presentations',
      resource: 'Toastmasters',
      deadline: '2024-12-31',
      progresses: [
        { description: 'Completed first presentation', date: '2024-06-01' },
        { description: 'Joined Toastmasters club', date: '2024-07-15' },
      ],
    },
  ],
  ...overrides,
});

const mockGetMyEvaluations = getMyEvaluations as ReturnType<typeof vi.fn>;

// ── Helper ─────────────────────────────────────────────────────────────────

const renderAndWait = async () => {
  render(<HistorySection />);
  await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('HistorySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Loading state ────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('shows a loading indicator while fetching', () => {
      // Never resolves during this test
      mockGetMyEvaluations.mockReturnValue(new Promise(() => {}));
      render(<HistorySection />);
      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('hides the loading indicator once data arrives', async () => {
      mockGetMyEvaluations.mockResolvedValue({ data: { content: [] } });
      render(<HistorySection />);
      expect(screen.getByText('Loading…')).toBeInTheDocument();
      await waitFor(() =>
        expect(screen.queryByText('Loading…')).not.toBeInTheDocument(),
      );
    });
  });

  // ── Error state ──────────────────────────────────────────────────────────

  describe('error state', () => {
    it('shows an error message when the API call fails', async () => {
      mockGetMyEvaluations.mockRejectedValue(new Error('Network error'));
      render(<HistorySection />);
      await waitFor(() =>
        expect(screen.getByText('Failed to load history.')).toBeInTheDocument(),
      );
    });
  });

  // ── Render ───────────────────────────────────────────────────────────────

  describe('render', () => {
    it('renders the page heading, description, and tabs', async () => {
      mockGetMyEvaluations.mockResolvedValue({ data: { content: [] } });
      await renderAndWait();
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(
        screen.getByText('Your past evaluation records — ratings, goals, and progress'),
      ).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Annual' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Quarter' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Probation' })).toBeInTheDocument();
    });


    it('only shows evaluations whose status is CLOSED', async () => {
      mockGetMyEvaluations.mockResolvedValue({
        data: {
          content: [
            makeEvaluation({ id: '1', status: 'CLOSED', cycle: '2024' }),
            makeEvaluation({ id: '2', status: 'OPEN', cycle: '2023' }),
            makeEvaluation({ id: '3', status: 'PENDING', cycle: '2022' }),
          ],
        },
      });
      await renderAndWait();
      expect(screen.getByText('2024 Annual')).toBeInTheDocument();
      expect(screen.queryByText('2023 Annual')).not.toBeInTheDocument();
      expect(screen.queryByText('2022 Annual')).not.toBeInTheDocument();
    });

    it('shows empty state on Quarter tab when only Annual data exists', async () => {
      mockGetMyEvaluations.mockResolvedValue({
        data: { content: [makeEvaluation({ type: 'ANNUAL', status: 'CLOSED' })] },
      });
      await renderAndWait();
      await userEvent.click(screen.getByRole('tab', { name: 'Quarter' }));
      expect(screen.getByText('No history yet.')).toBeInTheDocument();
    });

    it('only shows records matching the selected tab type', async () => {
      mockGetMyEvaluations.mockResolvedValue({
        data: {
          content: [
            makeEvaluation({ id: 'a', type: 'ANNUAL', status: 'CLOSED', cycle: '2024' }),
            makeEvaluation({ id: 'q', type: 'QUARTER', status: 'CLOSED', cycle: 'Q1 2024' }),
            makeEvaluation({ id: 'p', type: 'PROBATION', status: 'CLOSED', cycle: 'Probation' }),
          ],
        },
      });
      await renderAndWait();

      // Annual tab (default) shows only annual record
      expect(screen.getByText('2024 Annual')).toBeInTheDocument();
      expect(screen.queryByText('Q1 2024 Quarter')).not.toBeInTheDocument();

      // Quarter tab shows only quarter record
      await userEvent.click(screen.getByRole('tab', { name: 'Quarter' }));
      expect(screen.getByText('Q1 2024 Quarter')).toBeInTheDocument();
      expect(screen.queryByText('2024 Annual')).not.toBeInTheDocument();

      // Probation tab shows only probation record
      await userEvent.click(screen.getByRole('tab', { name: 'Probation' }));
      expect(screen.getByText('Probation Probation')).toBeInTheDocument();
      expect(screen.queryByText('Q1 2024 Quarter')).not.toBeInTheDocument();
    });
  });

  // ── Record card: expand / collapse ───────────────────────────────────────

  describe('record card expand/collapse', () => {
    beforeEach(async() => {
      mockGetMyEvaluations.mockResolvedValue({
        data: { content: [makeEvaluation()] },
      });
      await renderAndWait();
    });

    it('expands the card when clicked', async () => {
      await userEvent.click(screen.getByText('2024 Annual'));
      expect(screen.getByRole('tab', { name: 'Ratings' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Goals & Progress' })).toBeInTheDocument();
    });

    it('collapses the card when clicked again', async () => {
      const header = screen.getByText('2024 Annual');
      await userEvent.click(header);
      await userEvent.click(header);
      expect(screen.queryByRole('tab', { name: 'Ratings' })).not.toBeInTheDocument();
    });
  });

  // ── Ratings tab ──────────────────────────────────────────────────────────

  describe('ratings tab', () => {
    beforeEach(async () => {
      mockGetMyEvaluations.mockResolvedValue({
        data: { content: [makeEvaluation()] },
      });
      await renderAndWait();
      await userEvent.click(screen.getByText('2024 Annual'));
    });

    it('shows the Ratings tab by default when expanded', () => {
      expect(screen.getByRole('tab', { name: 'Ratings', selected: true })).toBeInTheDocument();
    });

    it('renders evaluation item information', () => {
      expect(screen.getByText('Communication')).toBeInTheDocument();
      expect(screen.getByText('How well you communicate')).toBeInTheDocument();
      expect(screen.getByText('Teamwork')).toBeInTheDocument();
      expect(screen.getByText('Collaboration skills')).toBeInTheDocument();
      expect(screen.getByText('Great communicator')).toBeInTheDocument();
      expect(screen.getByText('Excellent team player')).toBeInTheDocument();
    });

    it('shows "No ratings recorded." when evaluationItems is empty', async () => {
      mockGetMyEvaluations.mockResolvedValue({
        data: { content: [makeEvaluation({ cycle: '2025', evaluationItems: [] })] },
      });
      await renderAndWait();
      await userEvent.click(screen.getByText('2025 Annual'));
      expect(screen.getByText('No ratings recorded.')).toBeInTheDocument();
    });

    it('shows average rating in the card header', () => {
      // avg of rating 4 and 5 = 4.5
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('shows goal count badge in the card header', () => {
      expect(screen.getByText('1 goal')).toBeInTheDocument();
    });
  });

  // ── Goals & Progress tab ─────────────────────────────────────────────────

  describe('goals & progress tab', () => {
    beforeEach(async () => {
      mockGetMyEvaluations.mockResolvedValue({
        data: { content: [makeEvaluation()] },
      });
      await renderAndWait();
      await userEvent.click(screen.getByText('2024 Annual'));
      await userEvent.click(screen.getByRole('tab', { name: 'Goals & Progress' }));
    });

    it('renders goal information', () => {
      expect(screen.getByText('Improve public speaking')).toBeInTheDocument();
      expect(screen.getByText('Needed for leadership track')).toBeInTheDocument();
      expect(screen.getByText('3 presentations')).toBeInTheDocument();
      expect(screen.getByText('Toastmasters')).toBeInTheDocument();
      expect(screen.getByText('2024-12-31')).toBeInTheDocument();
    });

    it('shows "View Progress" button when progresses exist', () => {
      expect(screen.getByRole('button', { name: /view progress/i })).toBeInTheDocument();
    });

    it('does NOT show "View Progress" button when progresses is empty', async () => {
        mockGetMyEvaluations.mockResolvedValue({
        data: {
          content: [
            makeEvaluation({
              cycle: '2025',
              goals: [
                {
                  id: '1',
                  definition: 'Empty goal',
                  relevance: 'Relevant',
                  metric: 'x',
                  resource: 'y',
                  deadline: null,
                  progresses: [],
                },
              ],
            }),
          ],
        },
      });
      await renderAndWait();
      await userEvent.click(screen.getByText('2024 Annual'));
      await userEvent.click(screen.getByText('2025 Annual'));
      await userEvent.click(screen.getByRole('tab', { name: 'Goals & Progress' }));
      expect(screen.queryByRole('button', { name: /view progress/i })).not.toBeInTheDocument();
    });

  });


  // ── Multiple records ─────────────────────────────────────────────────────

  describe('multiple records', () => {
    it('renders multiple cards when multiple CLOSED evaluations exist', async () => {
      mockGetMyEvaluations.mockResolvedValue({
        data: {
          content: [
            makeEvaluation({ id: '1', cycle: '2024', status: 'CLOSED' }),
            makeEvaluation({ id: '2', cycle: '2023', status: 'CLOSED' }),
          ],
        },
      });
      await renderAndWait();
      expect(screen.getByText('2024 Annual')).toBeInTheDocument();
      expect(screen.getByText('2023 Annual')).toBeInTheDocument();
    });

    it('each card is independently expandable', async () => {
      mockGetMyEvaluations.mockResolvedValue({
        data: {
          content: [
            makeEvaluation({ id: '1', cycle: '2024', status: 'CLOSED' }),
            makeEvaluation({ id: '2', cycle: '2023', status: 'CLOSED' }),
          ],
        },
      });
      await renderAndWait();

      // Expand first card only
      await userEvent.click(screen.getByText('2024 Annual'));

      const allRatingsTabs = screen.queryAllByRole('tab', { name: 'Ratings' });
      expect(allRatingsTabs).toHaveLength(1);
    });
  });
});