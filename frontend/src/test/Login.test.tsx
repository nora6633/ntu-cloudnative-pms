import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
//import { ReactNode } from 'react';
import Login from '../pages/Login';
import { AuthContext, type AuthContextValue } from '../auth/AuthContext';
import { useNavigate, useLocation, BrowserRouter } from 'react-router';

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: vi.fn(),
  };
});

const mockNavigate = vi.fn();
const mockUseNavigate = vi.mocked(useNavigate);
const mockUseLocation = vi.mocked(useLocation);

function renderLogin(contextValue?: Partial<AuthContextValue>): RenderResult {
  const defaultContext: AuthContextValue = {
    user: null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...contextValue,
  };

  return render(
    <BrowserRouter>
      <AuthContext.Provider value={defaultContext}>
        <Login />
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseLocation.mockReturnValue({
      state: null,
      pathname: '/login',
      search: '',
      hash: '',
      key: 'default',
    });
  });

  describe('Rendering', () => {
    it('should render the login form', () => {
      renderLogin();
      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
      const form = screen.getByRole('button', { name: /sign in/i }).closest('form');
      expect(form).toBeInTheDocument();
    });

    it('should render username and password input fields', () => {
      renderLogin();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should render submit button with correct text', () => {
      renderLogin();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should have correct input attributes', () => {
      renderLogin();
      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

      expect(usernameInput.type).toBe('text');
      expect(usernameInput.required).toBe(true);
      expect(usernameInput.getAttribute('autocomplete')).toBe('username');

      expect(passwordInput.type).toBe('password');
      expect(passwordInput.required).toBe(true);
      expect(passwordInput.getAttribute('autocomplete')).toBe('current-password');
    });
  });

  describe('Form Interaction', () => {
    it('should update username input on change', async () => {
      const user = userEvent.setup();
      renderLogin();
      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;

      await user.type(usernameInput, 'testuser');
      expect(usernameInput.value).toBe('testuser');
    });

    it('should update password input on change', async () => {
      const user = userEvent.setup();
      renderLogin();
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

      await user.type(passwordInput, 'password123');
      expect(passwordInput.value).toBe('password123');
    });

    it('should clear error message when form is submitted', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
      renderLogin({ login: mockLogin });

      // First failed attempt to show error
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
      });

      // Clear error on new submission
      await user.clear(screen.getByLabelText(/username/i));
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      mockLogin.mockResolvedValue(undefined);

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Error should not be visible during new attempt
      await waitFor(() => {
        expect(screen.queryByText(/invalid username or password/i)).not.toBeInTheDocument();
      });
    });
  });;

  describe('Form Submission', () => {
    it('should call login with username and password on submit', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockResolvedValue(undefined);
      renderLogin({ login: mockLogin });

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
      });
    });

    it('should disable submit button while submitting', async () => {
      const user = userEvent.setup();
      let resolveLogin: () => void;
      const mockLogin = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });
      renderLogin({ login: vi.fn().mockReturnValue(mockLogin) });

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();

      resolveLogin!();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should navigate to home after successful login', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockResolvedValue(undefined);
      renderLogin({ login: mockLogin });

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });

    it('should navigate to redirected path after successful login', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockResolvedValue(undefined);
      mockUseLocation.mockReturnValue({
        state: { from: { pathname: '/dashboard' } },
        pathname: '/login',
        search: '',
        hash: '',
        key: 'default',
      });
      renderLogin({ login: mockLogin });

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });
  });;

  describe('Error Handling', () => {
    it('should display error message on login failure', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockRejectedValue(new Error('Login failed'));
      renderLogin({ login: mockLogin });

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
      });
    });

    it('should not navigate on login failure', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockRejectedValue(new Error('Login failed'));
      renderLogin({ login: mockLogin });

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should re-enable submit button on login failure', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockRejectedValue(new Error('Login failed'));
      renderLogin({ login: mockLogin });

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });;

  describe('Form Validation', () => {
    it('should prevent form submission with empty fields', async () => {
      //const user = userEvent.setup();
      const mockLogin = vi.fn();
      renderLogin({ login: mockLogin });

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      // Try to submit without filling fields
      fireEvent.click(submitButton);

      // login should not be called due to browser validation
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe('Button State Changes', () => {
    it('should show "Signing in..." text while submitting', async () => {
      const user = userEvent.setup();
      let resolveLogin: () => void;
      const mockLogin = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });
      renderLogin({ login: vi.fn().mockReturnValue(mockLogin) });

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Verify button text changed to "Signing in..."
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveTextContent('Signing in...');

      resolveLogin!();

      // Verify button text changed back to "Sign in"
      await waitFor(() => {
        expect(buttons[0]).toHaveTextContent('Sign in');
        expect(buttons[0]).not.toHaveTextContent('Signing in');
      });
    });
  });
});