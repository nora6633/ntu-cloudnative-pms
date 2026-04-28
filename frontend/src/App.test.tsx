import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

vi.mock('./api/axiosInstance', () => ({
  default: {
    get: vi.fn().mockRejectedValue(new Error('not authenticated')),
    post: vi.fn(),
  },
}));

import App from './App';

test('renders loading state while checking auth', () => {
  render(<App />);
  expect(screen.getByText(/Loading/i)).toBeDefined();
});
