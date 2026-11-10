import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import Home from './Home';

jest.mock('axios');

function renderHome() {
  return render(<MemoryRouter><Home /></MemoryRouter>);
}

afterEach(() => jest.resetAllMocks());

test('calculator updates the remaining sample balance from preset amounts', () => {
  renderHome();

  expect(screen.getByText('₹7,000')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '₹10,000' }));

  expect(screen.getByText('₹0')).toBeInTheDocument();
});

test('merchant enquiry submits the entered details and shows confirmation', async () => {
  axios.post.mockResolvedValueOnce({ data: { message: 'received' } });
  renderHome();

  fireEvent.change(screen.getByLabelText('Business name'), { target: { value: 'North Store' } });
  fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Sam Example' } });
  fireEvent.change(screen.getByLabelText('Work email'), { target: { value: 'sam@example.com' } });
  fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '5551234567' } });
  fireEvent.click(screen.getByRole('button', { name: /send enquiry/i }));

  await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/api/pilot', expect.objectContaining({
    businessName: 'North Store', ownerName: 'Sam Example', email: 'sam@example.com', phone: '5551234567',
  })));
  expect(await screen.findByRole('heading', { name: 'Request received' })).toBeInTheDocument();
});

test('merchant enquiry displays the API error when submission fails', async () => {
  axios.post.mockRejectedValueOnce({ response: { data: { error: 'Please try again later.' } } });
  renderHome();

  fireEvent.change(screen.getByLabelText('Business name'), { target: { value: 'North Store' } });
  fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Sam Example' } });
  fireEvent.change(screen.getByLabelText('Work email'), { target: { value: 'sam@example.com' } });
  fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '5551234567' } });
  fireEvent.click(screen.getByRole('button', { name: /send enquiry/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Please try again later.');
});
