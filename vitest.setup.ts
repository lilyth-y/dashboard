import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';

import { server } from './__tests__/mocks/server';

// Mock ResizeObserver for dialog tests
global.ResizeObserver = class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
};

// Mock matchMedia for use-mobile and other responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => { }, // Deprecated
    removeListener: () => { }, // Deprecated
    addEventListener: () => { },
    removeEventListener: () => { },
    dispatchEvent: () => false,
  }),
});

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());
