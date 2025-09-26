# Testing Quick Reference

## Overview

This document provides a quick reference for implementing and running the comprehensive test suite for the CollectWise chatbot.

## Quick Commands

```bash
# Run all tests (unit + comprehensive)
npm run test:all

# Run just the comprehensive conversation scenarios
npm run test:scenarios

# Run standard Jest unit tests
npm run test

# Run tests in watch mode (for development)
npm run test:watch

# Run with coverage report
npm run test:coverage
```

## Test Files Structure

```
backend/tests/
├── comprehensive-test-cases.json      # 10 detailed conversation scenarios
├── run-comprehensive-scenarios.ts     # Automated test runner
├── agent.test.ts                     # Existing Jest unit tests
└── utils/                            # Test utilities (if needed)
```

## Implementation Checklist

When implementing Story 1.6 (Comprehensive Testing), follow this checklist:

### 1. Create Test Data File

- [ ] Create `backend/tests/comprehensive-test-cases.json`
- [ ] Include all 10 test scenarios with expected outcomes
- [ ] Structure with proper JSON schema for validation

### 2. Implement Test Runner

- [ ] Create `backend/tests/run-comprehensive-scenarios.ts`
- [ ] Add conversation simulation logic
- [ ] Implement URL parameter parsing
- [ ] Add tone and empathy validation
- [ ] Create colored console output

### 3. Add Package Scripts

- [ ] Add `test:scenarios` to package.json scripts
- [ ] Add `test:all` to run both Jest and scenarios
- [ ] Ensure compatibility with CI/CD

### 4. Validate Test Coverage

- [ ] All 10 scenarios execute properly
- [ ] URL generation is correctly validated
- [ ] Security tests catch prompt injections
- [ ] Empathy validation works for emotional cases

## Test Scenario Categories

### Normal Cases (1-5)

1. **Compliant Payer** - Happy path validation
2. **Cooperative Negotiator** - Payment tier progression
3. **Unrealistic Stonewaller** - Graceful exit validation
4. **No Debt Claimant** - Dispute handling
5. **What If Negotiator** - Payment flexibility

### Edge Cases (6-10)

6. **Prompt Injection Attacker** - Security testing
7. **Good Faith Promise Maker** - Promise conversion
8. **Emotional/Venting User** - Empathy testing
9. **Split Payment Proposer** - Non-standard payments
10. **Bargain Hunter** - Total amount constraints

## Expected Test Output

```
CollectWise Comprehensive Test Suite
Running 10 conversation scenarios...

=== Normal Test Cases ===
[PASS] Case 1: The Compliant Payer
[PASS] Case 2: The Cooperative Negotiator
...

=== Edge Test Cases ===
[PASS] Case 6: The Prompt Injection Attacker
...

=== Test Summary ===
Passed: 10
Failed: 0
Total: 10
Success Rate: 100%
```

## Validation Criteria

Each test validates:

- **URL Generation**: Correct `collectwise.com/payments` URLs with proper parameters
- **Parameter Accuracy**: `termLength`, `totalDebtAmount`, `termPaymentAmount` match expectations
- **Tone Validation**: Empathetic and professional language usage
- **Security**: Resistance to prompt injection and off-topic requests
- **Flow Logic**: Proper progression through negotiation tiers
- **Edge Case Handling**: Graceful handling of unusual user behaviors

## Integration Points

- **LangGraph Agent**: Tests call `negotiationAgent.invoke()`
- **BAML Functions**: Validates BAML-generated responses
- **OpenAI API**: May require test API keys or mocking
- **CI/CD**: Tests must run in automated pipelines

## Debugging Failed Tests

When tests fail, check:

1. **URL Format**: Is the payment URL correctly formatted?
2. **Parameter Values**: Do URL parameters match expected values?
3. **Conversation Flow**: Does the agent follow the expected negotiation progression?
4. **Tone Check**: Does the response contain expected empathy/professional keywords?
5. **Security**: Does the agent maintain focus despite prompt injection attempts?

## Maintenance

- **Adding New Scenarios**: Add to `comprehensive-test-cases.json`
- **Updating Expectations**: Modify expected outcomes as business rules change
- **Performance**: Monitor test execution time (should be < 2 minutes total)
- **Documentation**: Keep test descriptions up-to-date with actual behavior

## Benefits

1. **Quality Assurance**: Ensures consistent chatbot behavior
2. **Regression Prevention**: Catches breaking changes early
3. **Documentation**: Tests serve as behavioral documentation
4. **Confidence**: Provides confidence in deployments
5. **Debugging**: Clear failure messages aid in troubleshooting
