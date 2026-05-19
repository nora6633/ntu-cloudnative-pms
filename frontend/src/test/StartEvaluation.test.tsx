import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StartEvaluationSection } from '../app/sections/StartEvaluationSection';
import { startEvaluationCycle, getAllJobsWithTemplates } from '../api';


// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('../api', () => ({
  getAllJobsWithTemplates: vi.fn(),
  startEvaluationCycle: vi.fn(),
}));

// shadcn/ui Select uses Radix UI portals — point them at document.body so
// they're queryable in tests.
vi.mock('@radix-ui/react-select', async () => {
  const actual = await vi.importActual<typeof import('@radix-ui/react-select')>(
    '@radix-ui/react-select',
  );
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock('../app/components/ui/select', () => ({
  Select: ({ onValueChange, children }: any) => (
    <select onChange={(e) => onValueChange(e.target.value)}>{children}</select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <>{placeholder}</>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

vi.mock('../app/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <>{children}</>,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <>{children}</>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
}));

// ── Fixtures ───────────────────────────────────────────────────────────────

const mockJobTemplates = [
  {
    id: 1,
    title: 'Junior HR',
    templates: [
      {
        id: 10,
        jobId: 1,
        evaluationType: 'ANNUAL',
        criteria: [
          { title: 'Communication', description: 'Clear verbal and written communication.' },
          { title: 'Teamwork',      description: 'Works well with colleagues.'            },
        ],
      },
      {
        id: 11,
        jobId: 1,
        evaluationType: 'QUARTER',
        criteria: [
          { title: 'Q Goal',        description: 'Achieves quarterly goals.'              },
        ],
      },
    ],
  },
  {
    id: 2,
    title: 'Software Engineer',
    templates: [
      {
        id: 20,
        jobId: 2,
        evaluationType: 'ANNUAL',
        criteria: [
          { title: 'Code Quality',  description: 'Writes clean, maintainable code.'      },
        ],
      },
      {
        id: 21,
        jobId: 2,
        evaluationType: 'PROBATION',
        criteria: [
          { title: 'Ramp-up',       description: 'Speed of onboarding to codebase.'      },
        ],
      },
    ],
  },
];

// ── Helper ─────────────────────────────────────────────────────────────────

/** Open a shadcn <Select> by its trigger text/placeholder and pick an item. */
async function selectOption(triggerLabel: string | RegExp, itemText: string | RegExp) {
  // Find the label that matches, then find the select within its parent container
  const labelElement = screen.getByText(triggerLabel);
  const container = labelElement.closest('div.space-y-2') || labelElement.closest('div');
  const trigger = container?.querySelector('select') as HTMLSelectElement;
  
  if (!trigger) {
    throw new Error(`Could not find select for label "${triggerLabel}"`);
  }
  
  // For native selects, find the option value that matches the text
  const optionsArray = Array.from(trigger.querySelectorAll('option'));
  const targetOption = optionsArray.find(opt => {
    if (itemText instanceof RegExp) {
      return itemText.test(opt.textContent || '');
    }
    return opt.textContent === itemText;
  });
  
  if (!targetOption || !targetOption.value) {
    throw new Error(`Could not find option with text matching "${itemText}"`);
  }
  
  // Set the value and dispatch a change event
  trigger.value = targetOption.value;
  const event = new Event('change', { bubbles: true });
  trigger.dispatchEvent(event);
}

async function renderAndWait() {
  const user = userEvent.setup();
  render(<StartEvaluationSection />);
  // Wait until the loading spinner disappears
  await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
  // Component is now loaded, but may have no data or may have data
  return user;
}
// ── Suite ──────────────────────────────────────────────────────────────────

describe('StartEvaluationSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Loading & error ──────────────────────────────────────────────────────

  describe('loading and error states', () => {
    it('shows loading indicator while fetching', () => {
        vi.mocked(getAllJobsWithTemplates).mockReturnValue(new Promise(() => {})); // never resolves
        render(<StartEvaluationSection />);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
      });

    it('renders the form heading', async () => {
      vi.mocked(getAllJobsWithTemplates).mockResolvedValue({ data: [] } as any);
      await renderAndWait();
      expect(screen.getByText('Start Evaluation')).toBeInTheDocument();
    });

    it('shows job rows after data loads', async () => {
      vi.mocked(getAllJobsWithTemplates).mockResolvedValue({
        data: mockJobTemplates,
      } as any);
      await renderAndWait();
      expect(screen.getByText('Junior HR')).toBeInTheDocument();
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    it('renders no job rows when the API returns an empty list', async () => {
      vi.mocked(getAllJobsWithTemplates).mockResolvedValue({ data: [] } as any);
      await renderAndWait();
      // Give the effect a tick to settle
      expect(screen.queryByRole('combobox', { name: /Junior HR/i })).toBeNull();
    });

    it('handles fetch error', async () => {
      vi.mocked(getAllJobsWithTemplates).mockRejectedValue(
        new Error('Network error'),
      );
      await renderAndWait();
      // Form heading still present, no crash
      expect(screen.getByText(/Failed to load page/i)).toBeInTheDocument();
    });
  });

  // ── Cycle name input ─────────────────────────────────────────────────────

  describe('cycle name input', () => {
    beforeEach(() => {
      vi.mocked(getAllJobsWithTemplates).mockResolvedValue({
        data: mockJobTemplates,
      } as any);
    });

    it('accepts typed text in the Cycle Name field', async () => {
      await renderAndWait();
      const input = screen.getByLabelText(/cycle name/i);
      await userEvent.type(input, '2026');
      await waitFor(() => expect(input).toHaveValue('2026'));
    });

    it('clears cycle name after successful submission', async () => {
      vi.mocked(startEvaluationCycle).mockResolvedValue({} as any);
      await renderAndWait();

      const input = screen.getByLabelText(/cycle name/i);
      await userEvent.type(input, '2026');
      await selectOption(/evaluation type/i, /annual/i);
      // Both job template dropdowns should now be pre-selected to ANNUAL templates;
      // submit form
      await userEvent.click(screen.getByRole('button', { name: /^start$/i }));
      await waitFor(() => expect(input).toHaveValue(''));
    });
  });

  // ── Evaluation type selection ────────────────────────────────────────────

  describe('evaluation type selection', () => {
    beforeEach(() => {
      vi.mocked(getAllJobsWithTemplates).mockResolvedValue({
        data: mockJobTemplates,
      } as any);
    });

    it('lists all three evaluation type options', async () => {
      await renderAndWait();
      const labelElement = screen.getByText('Evaluation Type');
      const container = labelElement.closest('div.space-y-2') || labelElement.closest('div');
      const trigger = container?.querySelector('select');
      if (!trigger) throw new Error('Could not find select');
      
      // Get all options available in this select
      const options = Array.from(trigger.querySelectorAll('option')).map(opt => opt.textContent);
      expect(options).toContain('Annual');
      expect(options).toContain('Quarter');
      expect(options).toContain('Probation');
    });

    it('selects ANNUAL evaluation type', async () => {
      await renderAndWait();
      await selectOption(/evaluation type/i, /annual/i);
      const labelElement = screen.getByText('Evaluation Type');
      const container = labelElement.closest('div.space-y-2') || labelElement.closest('div');
      const select = container?.querySelector('select');
      expect(select?.value).toBe('ANNUAL');
    });
  });

  // ── Template dropdown filtering ──────────────────────────────────────────

  describe('template dropdown filtering by evaluation type', () => {
    beforeEach(async () => {
      vi.mocked(getAllJobsWithTemplates).mockResolvedValue({
        data: mockJobTemplates,
      } as any);
    });


    it('shows only QUARTER templates for Junior HR when QUARTER is selected', async () => {
      await renderAndWait();

      await selectOption(/evaluation type/i, /quarter/i);

      // Wait for templates to be filtered after evaluation type changes
      await waitFor(() => {
        const juniorHRGroup = screen.getByText('Junior HR').closest('div.space-y-1\\.5') as HTMLElement;
        const juniorHRSelect = juniorHRGroup?.querySelector('select');
        
        if (!juniorHRSelect) throw new Error('Could not find Junior HR template select');
        
        const options = Array.from(juniorHRSelect.querySelectorAll('option')).map(opt => opt.textContent);
        expect(options).toContain('QUARTER #11');
        expect(options).not.toContain('ANNUAL #10');
      });
    });

    it('shows only PROBATION templates for Software Engineer when PROBATION is selected', async () => {
      await renderAndWait();

      await selectOption(/evaluation type/i, /probation/i);

      // Wait for templates to be filtered after evaluation type changes
      await waitFor(() => {
        const seGroup = screen.getByText('Software Engineer').closest('div.space-y-1\\.5') as HTMLElement;
        const seSelect = seGroup?.querySelector('select');
        
        if (!seSelect) throw new Error('Could not find Software Engineer template select');
        
        const options = Array.from(seSelect.querySelectorAll('option')).map(opt => opt.textContent);
        expect(options).toContain('PROBATION #21');
        expect(options).not.toContain('ANNUAL #20');
      });
    });

    it('do not show template selection when no satisfied template', async () => {
      await renderAndWait();

      await selectOption(/evaluation type/i, /quarter/i);

      // Wait for templates to be filtered after evaluation type changes
      await waitFor(() => {
        const seGroup = screen.getByText('Software Engineer').closest('div.space-y-1\\.5') as HTMLElement;
        const seSelect = seGroup?.querySelector('select');
        expect(!seSelect);
      });
    });
  });

  // ── Submit button guard ──────────────────────────────────────────────────

  describe('Start button disabled state', () => {
    beforeEach(async () => {
      vi.mocked(getAllJobsWithTemplates).mockResolvedValue({
        data: mockJobTemplates,
      } as any);
    });

    it('is disabled when not all fields are filled, able when all filled', async () => {
      await renderAndWait();
      expect(screen.getByRole('button', { name: /^start$/i })).toBeDisabled();

      await userEvent.type(screen.getByLabelText(/cycle name/i), '2026');
      expect(screen.getByRole('button', { name: /^start$/i })).toBeDisabled();

      await selectOption(/evaluation type/i, /annual/i);

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /^start$/i })).not.toBeDisabled(),
      );
    });

    it('is disabled when any template selection is empty', async () => {
      await renderAndWait();
      await userEvent.type(screen.getByLabelText(/cycle name/i), '2026');
      await selectOption(/evaluation type/i, /quarter/i);
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /^start$/i })).toBeDisabled(),
      );
    });

  });

  // ── Notification after Start ─────────────────────────────────────────────

  describe('notification after clicking Start', () => {
    beforeEach(async () => {
      vi.mocked(getAllJobsWithTemplates).mockResolvedValue({
        data: mockJobTemplates,
      } as any);
    });

    it('shows success notification on successful API call', async () => {
      vi.mocked(startEvaluationCycle).mockResolvedValue({} as any);
      await renderAndWait();

      await userEvent.type(screen.getByLabelText(/cycle name/i), '2026');
      await selectOption(/evaluation type/i, /annual/i);
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /^start$/i })).not.toBeDisabled(),
      );

      await userEvent.click(screen.getByRole('button', { name: /^start$/i }));

      expect(
        await screen.findByText(/evaluation cycle started successfully/i),
      ).toBeInTheDocument();
    });

    it('shows error notification when API call fails', async () => {
      vi.mocked(startEvaluationCycle).mockRejectedValue(new Error('Server error'));
      await renderAndWait();

      await userEvent.type(screen.getByLabelText(/cycle name/i), '2026');
      await selectOption(/evaluation type/i, /annual/i);
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /^start$/i })).not.toBeDisabled(),
      );

      await userEvent.click(screen.getByRole('button', { name: /^start$/i }));

      expect(
        await screen.findByText(/failed to start evaluation/i),
      ).toBeInTheDocument();
    });

    it('calls startEvaluationCycle with correct payload', async () => {
      vi.mocked(startEvaluationCycle).mockResolvedValue({} as any);
      await renderAndWait();

      await userEvent.type(screen.getByLabelText(/cycle name/i), '2026');
      await selectOption(/evaluation type/i, /annual/i);
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /^start$/i })).not.toBeDisabled(),
      );

      await userEvent.click(screen.getByRole('button', { name: /^start$/i }));

      await waitFor(() =>
        expect(startEvaluationCycle).toHaveBeenCalledWith({
          cycleName: '2026',
          evaluationType: 'ANNUAL',
          jobToTemplateIdMap: {
            '1': 10, // highest ANNUAL id for Junior HR
            '2': 20, // highest ANNUAL id for Software Engineer
          },
        }),
      );
    });
  });

  // ── Template preview ─────────────────────────────────────────────────────

  describe('template preview dialog', () => {
    it('opens and displays criteria when View template is clicked', async () => {
      vi.mocked(getAllJobsWithTemplates).mockResolvedValue({
        data: mockJobTemplates,
      } as any);
      await renderAndWait();

      await selectOption(/evaluation type/i, /annual/i);

      const viewButtons = screen.getAllByRole('button', { name: /view template/i });
      await userEvent.click(viewButtons[0]); // Junior HR

      // Dialog content should appear in a portal, check if text is visible
      expect(await screen.findByText('Communication')).toBeInTheDocument();
      expect(await screen.findByText('Clear verbal and written communication.')).toBeInTheDocument();
    });
  });
});