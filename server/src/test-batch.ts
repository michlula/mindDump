import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Dynamic imports — must happen after dotenv.config()
const { createClient } = await import('@supabase/supabase-js');
const { processStaleBatches } = await import('./services/batchProcessor.js');
const { Bot } = await import('grammy');

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const TEST_CHAT_ID = -999999999;

// Mock bot that logs instead of sending Telegram messages
function createMockBot(): InstanceType<typeof Bot> {
  const bot = {
    api: {
      sendMessage: async (chatId: number, text: string, _opts?: unknown) => {
        console.log(`  [MockBot] sendMessage to ${chatId}: ${text}`);
        return { message_id: Math.floor(Math.random() * 10000) };
      },
      getFile: async () => ({ file_path: 'test.jpg' }),
    },
  } as unknown as InstanceType<typeof Bot>;
  return bot;
}

async function cleanup() {
  // Delete test dumps
  await supabase
    .from('dumps')
    .delete()
    .eq('telegram_message_id', -1);

  // Delete pending messages for test chat
  await supabase
    .from('pending_messages')
    .delete()
    .eq('telegram_chat_id', TEST_CHAT_ID);

  // Delete pending categorizations for test chat
  await supabase
    .from('pending_categorizations')
    .delete()
    .eq('telegram_chat_id', TEST_CHAT_ID);

  // Delete dumps that were created by test (metadata marker)
  await supabase
    .from('dumps')
    .delete()
    .contains('metadata', { test_run: true });
}

async function insertTestMessage(content: string, type: 'text' | 'link' = 'text', messageId?: number) {
  const { data, error } = await supabase
    .from('pending_messages')
    .insert({
      telegram_chat_id: TEST_CHAT_ID,
      telegram_message_id: messageId || Math.floor(Math.random() * 100000),
      message_type: type,
      content,
      metadata: { test_run: true },
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getTestDumps() {
  const { data, error } = await supabase
    .from('dumps')
    .select('*')
    .contains('metadata', { test_run: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ============================================================
// Tests
// ============================================================

async function testSingleMessage() {
  console.log('\n--- Test 1: Single message → 1 dump ---');
  await cleanup();

  await insertTestMessage('Buy milk and eggs from the store');

  console.log('  Waiting 4s for stale window...');
  await sleep(4000);

  const bot = createMockBot();
  const count = await processStaleBatches(bot);
  console.log(`  Processed ${count} chat(s)`);

  const dumps = await getTestDumps();
  console.log(`  Dumps created: ${dumps.length}`);

  if (dumps.length === 1) {
    console.log('  ✓ PASS: Single message created exactly 1 dump');
    console.log(`    Title: ${(dumps[0].metadata as Record<string, unknown>)?.title}`);
    console.log(`    Category: ${dumps[0].category_id ? 'assigned' : 'none (low confidence)'}`);
  } else if (dumps.length === 0) {
    console.log('  ✗ FAIL: No dumps created — batch may not have been stale yet');
  } else {
    console.log(`  ✗ FAIL: Expected 1 dump, got ${dumps.length}`);
  }

  return dumps.length === 1;
}

async function testRelatedMessages() {
  console.log('\n--- Test 2: Two related messages → ideally 1 grouped dump ---');
  await cleanup();

  await insertTestMessage('I found a great pasta recipe');
  await sleep(500);
  await insertTestMessage('You need tomatoes, garlic, basil, and olive oil');

  console.log('  Waiting 4s for stale window...');
  await sleep(4000);

  const bot = createMockBot();
  const count = await processStaleBatches(bot);
  console.log(`  Processed ${count} chat(s)`);

  const dumps = await getTestDumps();
  console.log(`  Dumps created: ${dumps.length}`);

  if (dumps.length === 1) {
    console.log('  ✓ IDEAL: Two related messages grouped into 1 dump');
    const meta = dumps[0].metadata as Record<string, unknown>;
    console.log(`    Title: ${meta?.title}`);
    console.log(`    Grouped messages: ${meta?.grouped_messages || 1}`);
  } else if (dumps.length === 2) {
    console.log('  ~ ACCEPTABLE: AI created 2 separate dumps (non-deterministic)');
    dumps.forEach((d, i) => {
      console.log(`    Dump ${i + 1}: ${(d.metadata as Record<string, unknown>)?.title}`);
    });
  } else {
    console.log(`  ✗ FAIL: Unexpected dump count: ${dumps.length}`);
  }

  return dumps.length >= 1 && dumps.length <= 2;
}

async function testUnrelatedMessages() {
  console.log('\n--- Test 3: Two unrelated messages → ideally 2 separate dumps ---');
  await cleanup();

  await insertTestMessage('Check out this job posting for a senior developer');
  await sleep(500);
  await insertTestMessage('That cat video was hilarious LOL');

  console.log('  Waiting 4s for stale window...');
  await sleep(4000);

  const bot = createMockBot();
  const count = await processStaleBatches(bot);
  console.log(`  Processed ${count} chat(s)`);

  const dumps = await getTestDumps();
  console.log(`  Dumps created: ${dumps.length}`);

  if (dumps.length === 2) {
    console.log('  ✓ IDEAL: Two unrelated messages → 2 separate dumps');
    dumps.forEach((d, i) => {
      console.log(`    Dump ${i + 1}: ${(d.metadata as Record<string, unknown>)?.title}`);
    });
  } else if (dumps.length === 1) {
    console.log('  ~ ACCEPTABLE: AI grouped them (non-deterministic, but not ideal)');
    console.log(`    Title: ${(dumps[0].metadata as Record<string, unknown>)?.title}`);
  } else {
    console.log(`  ✗ FAIL: Unexpected dump count: ${dumps.length}`);
  }

  return dumps.length >= 1 && dumps.length <= 2;
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('=== Mind Dump Batch Processing Test ===');
  console.log(`Test chat ID: ${TEST_CHAT_ID}`);
  console.log(`Supabase URL: ${process.env.SUPABASE_URL}`);

  const results: boolean[] = [];

  try {
    results.push(await testSingleMessage());
    results.push(await testRelatedMessages());
    results.push(await testUnrelatedMessages());
  } catch (error) {
    console.error('\n✗ Test suite error:', error);
  } finally {
    console.log('\n--- Cleanup ---');
    await cleanup();
    console.log('  Test data removed.');
  }

  console.log('\n=== Results ===');
  const passed = results.filter(Boolean).length;
  console.log(`${passed}/${results.length} tests passed`);

  if (passed === results.length) {
    console.log('All tests passed!');
  } else {
    console.log('Some tests failed — check output above.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
