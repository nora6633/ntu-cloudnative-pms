import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RegisterSection } from '../app/sections/RegisterSection';
import { 
  getAllJobs, 
  getDepartments, 
  getSupervisors, 
  getAllTemplateByJobId, 
  registration 
} from '../api';

// Mock API
vi.mock('../api');

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  UserPlus: () => <div data-testid="user-plus-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
}));

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock UI Components (Simplified)
vi.mock('../app/components/ui/select', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Select: ({ onValueChange, children, value }: any) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)} data-testid="mock-select">{children}</select>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SelectTrigger: ({ children }: any) => <>{children}</>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SelectValue: ({ placeholder }: any) => <>{placeholder}</>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SelectContent: ({ children }: any) => <>{children}</>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

vi.mock('../app/components/ui/checkbox', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Checkbox: ({ checked, onCheckedChange, id }: any) => (
    <input 
      type="checkbox" 
      id={id} 
      checked={checked} 
      onChange={(e) => onCheckedChange(e.target.checked)} 
    />
  ),
}));

const MOCK_JOBS = [{ id: 1, title: 'Software Engineer (Junior)' }];
const MOCK_DEPARTMENTS = [{ id: 10, name: 'Engineering' }];
const MOCK_SUPERVISORS = [{ id: 100, username: 'boss', role: 'MANAGER' }];

describe('RegisterSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getAllJobs).mockResolvedValue({ data: MOCK_JOBS, status: 200 } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDepartments).mockResolvedValue({ data: MOCK_DEPARTMENTS, status: 200 } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getSupervisors).mockResolvedValue({ data: MOCK_SUPERVISORS, status: 200 } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getAllTemplateByJobId).mockResolvedValue({ data: [], status: 200 } as any);
  });

  it('submits form correctly', async () => {
    const user = userEvent.setup();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(registration).mockResolvedValue({ data: {}, status: 201 } as any);
    
    const { container } = render(<RegisterSection />);

    await waitFor(() => expect(getAllJobs).toHaveBeenCalled());

    const usernameInput = container.querySelector('#reg-username') as HTMLInputElement;
    const passwordInput = container.querySelector('#reg-password') as HTMLInputElement;
    const roleSelect = container.querySelectorAll('select')[0];

    await user.type(usernameInput, 'tester');
    await user.type(passwordInput, 'password123');
    
    fireEvent.change(roleSelect, { target: { value: 'EMPLOYEE' } });

    await waitFor(() => expect(container.querySelectorAll('select').length).toBeGreaterThan(3));
    
    const selects = container.querySelectorAll('select');
    fireEvent.change(selects[1], { target: { value: '1' } });   // Job Title
    fireEvent.change(selects[2], { target: { value: '10' } });  // Department
    fireEvent.change(selects[3], { target: { value: '100' } }); // Supervisor

    const submitBtn = screen.getByRole('button', { name: /Register Account/i });
    
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    await user.click(submitBtn);

    expect(registration).toHaveBeenCalledWith(expect.objectContaining({
      username: 'tester',
      role: 'EMPLOYEE',
      jobId: 1,
      departmentId: 10,
      supervisorId: 100
    }));
  });

  it('shows overseen department for HR', async () => {
    const { container } = render(<RegisterSection />);
    await waitFor(() => expect(getAllJobs).toHaveBeenCalled());

    const roleSelect = container.querySelectorAll('select')[0];
    fireEvent.change(roleSelect, { target: { value: 'HR' } });

    await waitFor(() => expect(container.querySelectorAll('select').length).toBeGreaterThan(3));
    expect(container.textContent).toContain('Overseen Department');
  });

  it('shows probation template when checked', async () => {
    const { container } = render(<RegisterSection />);
    await waitFor(() => expect(getAllJobs).toHaveBeenCalled());

    const checkbox = container.querySelector('#reg-probation') as HTMLInputElement;
    fireEvent.click(checkbox);

    await waitFor(() => expect(screen.getByText(/Probation Template/i)).toBeInTheDocument());
  });

  it('fetches templates when job changes', async () => {
    const { container } = render(<RegisterSection />);
    await waitFor(() => expect(getAllJobs).toHaveBeenCalled());

    const checkbox = container.querySelector('#reg-probation') as HTMLInputElement;
    fireEvent.click(checkbox);

    const jobSelect = container.querySelectorAll('select')[1];
    fireEvent.change(jobSelect, { target: { value: '1' } });

    await waitFor(() => expect(getAllTemplateByJobId).toHaveBeenCalledWith(1, expect.any(Object)));
  });
});
