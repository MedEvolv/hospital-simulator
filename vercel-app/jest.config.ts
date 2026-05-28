/**
 * Jest configuration — v2 Phase 8
 *
 * Uses ts-jest to run TypeScript unit tests.
 * Path aliases (@/) are resolved via moduleNameMapper.
 */

import type { Config } from 'jest'
import { pathsToModuleNameMapper } from 'ts-jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '<rootDir>/__tests__/**/*.test.ts',
    '<rootDir>/__tests__/**/*.test.tsx',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // Relax for tests — no need for strict JSX transform in unit tests
        jsx: 'react',
        esModuleInterop: true,
      },
    }],
  },
  // Don't transform node_modules except Supabase (ESM)
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase)/)',
  ],
  collectCoverageFrom: [
    'lib/engines/**/*.ts',
    'lib/traces/**/*.ts',
    'lib/scenarios/**/*.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
}

export default config
