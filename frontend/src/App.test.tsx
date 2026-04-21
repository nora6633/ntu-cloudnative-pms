import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from './App';

test('renders the welcome message', () => {
  render(<App />);
  const linkElement = screen.getByText(/Get started/i); // Matches "Get started"
  expect(linkElement).toBeDefined();
});