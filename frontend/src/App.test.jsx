import { render, screen } from '@testing-library/react'
import App from './App'

test('renders PMS heading', () => {
  render(<App />)
  expect(screen.getByText('PMS')).toBeInTheDocument()
})
