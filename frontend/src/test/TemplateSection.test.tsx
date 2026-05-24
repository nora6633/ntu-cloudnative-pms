import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TemplateSection } from '../app/sections/TemplateSection';
import {
  ApiError,
  createTemplate,
  getAllJobs,
  getAllTemplateByJobId,
  updateTemplate,
} from '../api';

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api');
  return {
    ...actual,
    getAllJobs: vi.fn(),
    getAllTemplateByJobId: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
  };
});

vi.mock('../app/components/ui/select', () => ({
  Select: ({ value, onValueChange, disabled, children }: any) => (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      disabled={disabled}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <>{placeholder}</>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

const JOBS = [
  { id: 1, title: 'Software Engineer' },
  { id: 2, title: 'Product Manager' },
];

const ENGINEERING_TEMPLATE = {
  id: 11,
  jobId: 1,
  name: 'Engineering Annual Review',
  evaluationType: 'ANNUAL',
  criteria: [{ title: 'Code Quality', description: 'Readable code' }],
};

describe('TemplateSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function renderSection() {
    render(<TemplateSection />);
    await waitFor(() => expect(getAllJobs).toHaveBeenCalled());
  }

  async function selectJob(value: string) {
    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(selects[0], value);
  }

  it('stays idle until a job is selected', async () => {
    vi.mocked(getAllJobs).mockResolvedValue({ data: JOBS } as any);

    await renderSection();

    expect(getAllTemplateByJobId).not.toHaveBeenCalled();
    expect(screen.getByText('Select a job to view templates.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeDisabled();
  });

  it('loads jobs and shows the selected job template list', async () => {
    vi.mocked(getAllJobs).mockResolvedValue({ data: JOBS } as any);
    vi.mocked(getAllTemplateByJobId).mockResolvedValue({
      data: [ENGINEERING_TEMPLATE],
    } as any);

    await renderSection();
    await selectJob('1');

    await waitFor(() => expect(getAllTemplateByJobId).toHaveBeenCalledWith(1));
    expect(await screen.findByText('Engineering Annual Review')).toBeInTheDocument();
    expect(await screen.findByText('1 criteria')).toBeInTheDocument();
  });

  it('shows an empty state when the selected job has no templates', async () => {
    vi.mocked(getAllJobs).mockResolvedValue({ data: JOBS } as any);
    vi.mocked(getAllTemplateByJobId).mockResolvedValue({ data: [] } as any);

    await renderSection();
    await selectJob('1');

    await waitFor(() => expect(screen.getByText('No templates yet')).toBeInTheDocument());
  });

  it('keeps Publish disabled until the form is valid', async () => {
    vi.mocked(getAllJobs).mockResolvedValue({ data: JOBS } as any);
    vi.mocked(getAllTemplateByJobId).mockResolvedValue({ data: [] } as any);

    await renderSection();
    await selectJob('1');

    const publishButton = screen.getByRole('button', { name: 'Publish' });
    expect(publishButton).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Template Name'), 'Engineering Annual Review');
    await userEvent.type(screen.getByLabelText('Title'), 'Code Quality');

    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(selects[2], 'ANNUAL');

    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled();
  });

  it('shows duplicate-name validation from the backend', async () => {
    vi.mocked(getAllJobs).mockResolvedValue({ data: JOBS } as any);
    vi.mocked(getAllTemplateByJobId).mockResolvedValue({ data: [] } as any);
    vi.mocked(createTemplate).mockRejectedValue(new ApiError({
      kind: 'http',
      status: 409,
      message: 'The request conflicts with existing data.',
    }));

    await renderSection();
    await selectJob('1');

    await userEvent.type(screen.getByLabelText('Template Name'), 'Engineering Annual Review');
    await userEvent.type(screen.getByLabelText('Title'), 'Code Quality');
    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(selects[2], 'ANNUAL');
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));

    expect(await screen.findByText('A template with this name already exists for the selected job.')).toBeInTheDocument();
  });

  it('selects an existing template and switches to edit mode', async () => {
    vi.mocked(getAllJobs).mockResolvedValue({ data: JOBS } as any);
    vi.mocked(getAllTemplateByJobId).mockResolvedValue({
      data: [ENGINEERING_TEMPLATE],
    } as any);

    await renderSection();
    await selectJob('1');
    await userEvent.click(await screen.findByRole('button', { name: /Engineering Annual Review/i }));

    expect(screen.getByText('Edit Template')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Engineering Annual Review')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
  });

  it('saves changes for an existing template and refreshes the hydrated selection', async () => {
    const updatedTemplate = {
      ...ENGINEERING_TEMPLATE,
      name: 'Engineering Annual Review Updated',
      criteria: [{ title: 'Architecture', description: 'System design quality' }],
    };

    vi.mocked(getAllJobs).mockResolvedValue({ data: JOBS } as any);
    vi.mocked(getAllTemplateByJobId)
      .mockResolvedValueOnce({ data: [ENGINEERING_TEMPLATE] } as any)
      .mockResolvedValueOnce({ data: [updatedTemplate] } as any);
    vi.mocked(updateTemplate).mockResolvedValue({ data: updatedTemplate } as any);

    await renderSection();
    await selectJob('1');
    await userEvent.click(await screen.findByRole('button', { name: /Engineering Annual Review/i }));

    const nameInput = screen.getByLabelText('Template Name');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Engineering Annual Review Updated');

    const titleInput = screen.getByLabelText('Title');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Architecture');

    const descriptionInput = screen.getByLabelText('Description');
    await userEvent.clear(descriptionInput);
    await userEvent.type(descriptionInput, 'System design quality');

    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() =>
      expect(updateTemplate).toHaveBeenCalledWith(11, {
        name: 'Engineering Annual Review Updated',
        evaluationType: 'ANNUAL',
        criteria: [{ title: 'Architecture', description: 'System design quality' }],
      }),
    );
    expect(getAllTemplateByJobId).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('Template updated successfully.')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Engineering Annual Review Updated')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Engineering Annual Review Updated/i })).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Architecture')).toBeInTheDocument();
  });

  it('keeps form state when save changes fails', async () => {
    vi.mocked(getAllJobs).mockResolvedValue({ data: JOBS } as any);
    vi.mocked(getAllTemplateByJobId).mockResolvedValue({ data: [ENGINEERING_TEMPLATE] } as any);
    vi.mocked(updateTemplate).mockRejectedValue(new ApiError({
      kind: 'network',
      message: 'Network error. Please try again later.',
    }));

    await renderSection();
    await selectJob('1');
    await userEvent.click(await screen.findByRole('button', { name: /Engineering Annual Review/i }));

    const nameInput = screen.getByLabelText('Template Name');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Broken Save Name');

    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByText('Network error. Please try again later.')).toBeInTheDocument();
    expect(getAllTemplateByJobId).toHaveBeenCalledTimes(1);
    expect(screen.getByDisplayValue('Broken Save Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
  });

  it('refreshes the template list after a successful create', async () => {
    vi.mocked(getAllJobs).mockResolvedValue({ data: JOBS } as any);
    vi.mocked(getAllTemplateByJobId)
      .mockResolvedValueOnce({ data: [] } as any)
      .mockResolvedValueOnce({ data: [ENGINEERING_TEMPLATE] } as any);
    vi.mocked(createTemplate).mockResolvedValue({ data: ENGINEERING_TEMPLATE } as any);

    await renderSection();
    await selectJob('1');

    await userEvent.type(screen.getByLabelText('Template Name'), 'Engineering Annual Review');
    await userEvent.type(screen.getByLabelText('Title'), 'Code Quality');
    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(selects[2], 'ANNUAL');
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));

    expect(await screen.findByText('Template published successfully.')).toBeInTheDocument();
    expect(await screen.findByText('Engineering Annual Review')).toBeInTheDocument();
  });
});
