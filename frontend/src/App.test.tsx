import { render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import App from './App';


vi.mock('./api', () => ({
  me: vi.fn().mockRejectedValue(new Error('not authenticated')),
}));


test('renders loading state while checking auth', async () => {
  render(<App />);
  expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
  });
});
