module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  // extensionsToTreatAsEsm: ['.ts', '.tsx'], // Removed for CJS focus
  setupFilesAfterEnv: ['./jest.setup.ts'], // Or .ts if we make that
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs', // Force CommonJS output for tests
        jsx: 'react-jsx',     // Ensure new JSX transform is used
        esModuleInterop: true // Usually good to keep from original tsconfig
      },
      babelConfig: {
        presets: [['@babel/preset-react', { runtime: 'automatic' }]]
      }
      // useESM: false, // Default, so can be omitted
    }]
  },
  transformIgnorePatterns: [
    "/node_modules/(?!lucide-react|@radix-ui|react-day-picker|date-fns)/"
    // Keep this as these modules might still be ESM and need transformation by Babel via ts-jest
  ]
};
