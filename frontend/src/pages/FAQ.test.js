import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FAQ from './FAQ';

test('FAQ answer expands when its question is selected', () => {
  render(<MemoryRouter><FAQ /></MemoryRouter>);
  const question = screen.getByRole('button', { name: /Are payments real\?/i });

  expect(question).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(question);

  expect(question).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText(/No payment provider is contacted and no money is transferred/i)).toBeInTheDocument();
});
