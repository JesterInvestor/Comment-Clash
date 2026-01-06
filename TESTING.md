# Testing Guide

## Running Tests Locally

### Backend Tests

All backend tests are designed to run **without external dependencies** (Firebase, Redis, DigitalOcean Spaces). This makes them fast and reliable for CI/CD.

```bash
cd backend

# Install dependencies (first time only)
npm install

# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

Current test coverage:
- ✅ **Caption Generator**: 100% coverage
  - Caption generation
  - Unique ID creation
  - Random shuffling
  
- ✅ **Game Manager**: ~62% coverage
  - Room creation and joining
  - Game state management
  - Player submissions
  - Judge rotation
  - Disconnect handling
  - Score tracking

## What's Tested (Without External Dependencies)

### Caption Generator Tests
- Generates correct number of captions
- Creates unique IDs for each caption
- Includes text in proper format
- Handles edge cases (zero count, large counts)

### Game Manager Tests
- Room code generation (6 character codes)
- Room creation with proper structure
- Player joining with validation
- Maximum player limits (8 players)
- Minimum player requirements (3 players)
- Host-only game start
- Card dealing logic
- Caption submission validation
- Judge rotation mechanics
- Player disconnect handling
- Game state tracking

## What's NOT Tested

These require external services and are mocked in tests:
- Firebase integration (game persistence)
- Redis caching (session storage)
- DigitalOcean Spaces (video retrieval)
- Socket.io events (real-time communication)

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

See `.github/workflows/ci.yml` for the full CI configuration.

## Writing New Tests

When adding new features, follow these guidelines:

1. **Mock External Dependencies**
   ```javascript
   jest.mock('../services/redis', () => ({
     getRedisClient: jest.fn(() => null)
   }));
   ```

2. **Test Core Logic Only**
   - Focus on business logic
   - Validate state transitions
   - Check error conditions

3. **Keep Tests Fast**
   - No network calls
   - No database operations
   - No file system operations

4. **Make Tests Isolated**
   - Reset state between tests
   - Don't depend on test order
   - Use `beforeEach` for setup

## Example Test

```javascript
describe('Feature', () => {
  beforeEach(() => {
    // Reset state
  });

  test('should handle valid input', () => {
    const result = someFunction('valid input');
    expect(result).toBe('expected output');
  });

  test('should throw error for invalid input', () => {
    expect(() => {
      someFunction('invalid input');
    }).toThrow('Expected error message');
  });
});
```

## Troubleshooting

### Tests Fail with Module Not Found
```bash
cd backend
npm install
```

### Tests Hang or Timeout
- Check for unresolved promises
- Ensure mocks return proper values
- Increase timeout if needed: `jest.setTimeout(10000)`

### Coverage Too Low
- Add tests for edge cases
- Test error conditions
- Test all branches

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Mocking Guide](https://jestjs.io/docs/mock-functions)
