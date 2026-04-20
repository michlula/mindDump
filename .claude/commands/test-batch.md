Run the batch processing integration test and analyze the results.

Steps:
1. Run: `cd server && npx tsx src/test-batch.ts`
2. Wait for all tests to complete (takes ~15s due to stale window waits)
3. Analyze the output:
   - Report which tests passed/failed
   - If any test failed, investigate why (check timing, DB state, AI response)
   - Suggest fixes if issues are found
4. Report a summary of results

Expected behavior:
- Test 1 (single message): Should always produce exactly 1 dump
- Test 2 (related messages): Ideal = 1 grouped dump, acceptable = 2 separate dumps
- Test 3 (unrelated messages): Ideal = 2 separate dumps, acceptable = 1 grouped dump

Note: Tests 2 and 3 depend on AI categorization which is non-deterministic.
"Acceptable" outcomes are not bugs — report them as informational.
