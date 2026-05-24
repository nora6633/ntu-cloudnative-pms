import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuditSection } from '../app/sections/AuditSection';
import { getAuditLogs, getModules } from '../api';

vi.mock('../api', () => ({
  getAuditLogs: vi.fn(),
  getModules: vi.fn(),
}));

// Mock Radix Select to plain <select> to dodge pointer-events issues
vi.mock('../app/components/ui/select', () => ({
  Select: ({
    onValueChange,
    children,
    value,
  }: {
    onValueChange: (value: string) => void;
    children: React.ReactNode;
    value?: string;
  }) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>{children}</select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <>{placeholder}</>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
}));

const ROW = {
  rev: 42,
  timestamp: '2026-05-10T10:00:00Z',
  username: 'admin',
  ipAddress: '127.0.0.1',
  actionType: 'CREATE',
  module: 'Evaluation',
  recordId: '1',
  changeSummary: 'Created Evaluation #1',
};

const PAGE_RESPONSE = {
  status: 200,
  data: {
    content: [ROW],
    totalElements: 1,
    totalPages: 1,
    size: 10,
    number: 0,
    first: true,
    last: true,
    numberOfElements: 1,
    empty: false,
  },
};

const EMPTY_RESPONSE = {
  status: 200,
  data: {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
    first: true,
    last: true,
    numberOfElements: 0,
    empty: true,
  },
};

const mockedGetAuditLogs = getAuditLogs as unknown as ReturnType<typeof vi.fn>;
const mockedGetModules = getModules as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockedGetAuditLogs.mockReset();
  mockedGetModules.mockReset();
  mockedGetModules.mockResolvedValue({ status: 200, data: ['User', 'Evaluation', 'Goal'] });
});

describe('AuditSection', () => {
  it('fetches audit logs on mount and renders them', async () => {
    mockedGetAuditLogs.mockResolvedValue(PAGE_RESPONSE);

    render(<AuditSection />);

    await waitFor(() => expect(mockedGetAuditLogs).toHaveBeenCalled());
    const table = await screen.findByRole('table');
    expect(within(table).getByText('admin')).toBeInTheDocument();
    expect(within(table).getByText('127.0.0.1')).toBeInTheDocument();
    expect(within(table).getByText('CREATE')).toBeInTheDocument();
    expect(within(table).getByText('Created Evaluation #1')).toBeInTheDocument();
  });

  it('shows empty state when no logs', async () => {
    mockedGetAuditLogs.mockResolvedValue(EMPTY_RESPONSE);

    render(<AuditSection />);

    await waitFor(() => {
      expect(screen.getByText('No audit logs found')).toBeInTheDocument();
    });
  });

  it('shows error when fetch fails', async () => {
    mockedGetAuditLogs.mockRejectedValue(new Error('boom'));

    render(<AuditSection />);

    await waitFor(() => {
      expect(screen.getByText('boom')).toBeInTheDocument();
    });
  });

  it('refetches with actor param when actor input changes', async () => {
    mockedGetAuditLogs.mockResolvedValue(EMPTY_RESPONSE);

    render(<AuditSection />);

    await waitFor(() => expect(mockedGetAuditLogs).toHaveBeenCalled());
    mockedGetAuditLogs.mockClear();

    await userEvent.type(screen.getByPlaceholderText(/Filter by username/i), 'alice');

    await waitFor(() => {
      const last = mockedGetAuditLogs.mock.calls.at(-1)?.[0];
      expect(last?.actor).toBe('alice');
    });
  });

  it('populates module dropdown from getModules', async () => {
    mockedGetAuditLogs.mockResolvedValue(EMPTY_RESPONSE);

    render(<AuditSection />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'User' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Evaluation' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Goal' })).toBeInTheDocument();
    });
  });
});
