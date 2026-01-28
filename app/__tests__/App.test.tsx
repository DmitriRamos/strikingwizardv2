import React from 'react';
import { render, screen } from '@testing-library/react-native';
import SetupScreen from '../app/index';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

describe('SetupScreen', () => {
  it('renders the setup screen with title', () => {
    render(<SetupScreen />);
    expect(screen.getByText('StrikingWizard')).toBeTruthy();
    expect(screen.getByText('Callout Runner Setup')).toBeTruthy();
  });

  it('renders the start button', () => {
    render(<SetupScreen />);
    expect(screen.getByText('Start Session')).toBeTruthy();
  });

  it('shows default callouts', () => {
    render(<SetupScreen />);
    expect(screen.getByText('Jab')).toBeTruthy();
    expect(screen.getByText('Cross')).toBeTruthy();
    expect(screen.getByText('1-2')).toBeTruthy();
  });

  it('shows round configuration controls', () => {
    render(<SetupScreen />);
    expect(screen.getByText('Rounds')).toBeTruthy();
    expect(screen.getByText('Round Duration')).toBeTruthy();
    expect(screen.getByText('Rest Duration')).toBeTruthy();
  });
});
