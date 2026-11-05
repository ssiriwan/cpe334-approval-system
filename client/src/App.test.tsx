/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders application title', () => {
    render(<App />);
    expect(screen.getByText(/Approval Flow System/i)).toBeDefined();
  });
});
