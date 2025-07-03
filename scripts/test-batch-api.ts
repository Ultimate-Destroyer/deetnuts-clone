import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testBatchAPI() {
    console.log('🧪 Testing PocketBase Batch API...');

    const pbUrl = process.env.POCKETBASE_URL || 'https://api.deetnuts.com';
    const pb = new PocketBase(pbUrl);

    // Disable auto-cancellation
    pb.autoCancellation(false);

    // Authenticate
    const token = process.env.POCKETBASE_AUTH_TOKEN;
    if (token) {
        console.log('🔑 Using auth token...');
        pb.authStore.save(token);
    } else {
        const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
        const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.error('❌ Missing credentials');
            return;
        }

        console.log('🔑 Authenticating with credentials...');
        await pb.admins.authWithPassword(adminEmail, adminPassword);
    }

    console.log('✅ Authentication successful');

    // Test creating a small batch
    console.log('📦 Creating test batch...');
    const batch = pb.createBatch();

    const testRecords = [
        {
            college_code: 'TEST001',
            college_name: 'Test College 1',
            course_code: 'TEST101',
            course_name: 'Test Course 1',
            category: 'TEST',
            seat_allocation_section: 'TEST_LEVEL',
            cutoff_score: '85.5',
            last_rank: '1000',
            total_admitted: 10,
            status: 'Test Status',
            home_university: 'Test University'
        },
        {
            college_code: 'TEST002',
            college_name: 'Test College 2',
            course_code: 'TEST102',
            course_name: 'Test Course 2',
            category: 'TEST',
            seat_allocation_section: 'TEST_LEVEL',
            cutoff_score: '87.5',
            last_rank: '800',
            total_admitted: 15,
            status: 'Test Status',
            home_university: 'Test University'
        }
    ];

    for (const record of testRecords) {
        batch.collection('2024_mht_cet_round_one_cutoffs_duplicate').create(record);
    }

    const startTime = Date.now();
    const result = await batch.send({ requestKey: `test_batch_${Date.now()}` });
    const endTime = Date.now();

    console.log(`✅ Batch created successfully in ${endTime - startTime}ms`);
    console.log(`📊 Results: ${result.length} records processed`);

    // Clean up test records
    console.log('🧹 Cleaning up test records...');
    const cleanupBatch = pb.createBatch();

    for (const response of result) {
        if (response.status === 200 && response.body && response.body.id) {
            cleanupBatch.collection('2024_mht_cet_round_one_cutoffs_duplicate').delete(response.body.id);
        }
    }

    await cleanupBatch.send({ requestKey: `cleanup_${Date.now()}` });
    console.log('✅ Test cleanup completed');

    console.log('🎉 Batch API test completed successfully!');
}

if (require.main === module) {
    testBatchAPI().catch(console.error);
}
