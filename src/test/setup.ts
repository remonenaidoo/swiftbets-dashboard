import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

// Components connect to the live hub once signed in; tests never open a real connection.
vi.mock('../shared/realtime/liveConnection', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../shared/realtime/liveConnection')>();
  const live = new actual.LiveConnection();
  live.start = () => undefined;
  return { ...actual, live };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
