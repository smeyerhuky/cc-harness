import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);

// The app's tests render whole screens, some loaded lazily, and wait for them. Testing Library
// waits 1 s by default, which a loaded CI runner outlasts: the same commit passed in one run and
// failed in the other. 4 s fails only what never comes, under the 15 s each test is allowed.
configure({ asyncUtilTimeout: 4000 });
