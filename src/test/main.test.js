import { render, screen } from '@testing-library/react';
import Login from '../routes/Login.jsx';

test('renders learn react link', () => {
    render(<Login />);
    const linkElement = screen.getByText(/Login To Your Account/i);
    expect(linkElement).toBeInTheDocument();
});
