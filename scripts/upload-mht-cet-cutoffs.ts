import PocketBase from 'pocketbase';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface CutoffRecord {
    college_code: string;
    college_name: string;
    course_code: string;
    course_name: string;
    category: string;
    seat_allocation_section: string;
    cutoff_score: string;
    last_rank: string;
    total_admitted: number;
}

class MHTCETCutoffUploader {
    private pb: PocketBase;
    private csvFilePath: string;
    private collectionName = '2024_mht_cet_round_one_cutoffs';

    constructor() {
        // Initialize PocketBase - adjust URL as needed
        const pbUrl = process.env.POCKETBASE_URL || 'https://api.deetnuts.com';
        this.pb = new PocketBase(pbUrl);

        // Set CSV file path - the CSV is in the scripts folder
        this.csvFilePath = path.join(__dirname, 'combined_cutoffs.csv');
    }

    async authenticate() {
        const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
        const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

        console.log('🔍 Debug info:');
        console.log(`   Email: ${adminEmail ? adminEmail.substring(0, 3) + '***' : 'NOT SET'}`);
        console.log(`   Password: ${adminPassword ? '***' + adminPassword.substring(adminPassword.length - 3) : 'NOT SET'}`);
        console.log(`   PocketBase URL: ${this.pb.baseUrl}`);

        if (!adminEmail || !adminPassword) {
            throw new Error(
                'POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set in environment variables'
            );
        }

        try {
            // Try admin authentication first
            console.log('🔑 Attempting admin authentication...');
            await this.pb.admins.authWithPassword(adminEmail, adminPassword);
            console.log('✅ Successfully authenticated as admin');
        } catch (adminError) {
            console.log('❌ Admin authentication failed, trying regular user authentication...');
            try {
                // Fallback to regular user authentication
                await this.pb.collection('users').authWithPassword(adminEmail, adminPassword);
                console.log('✅ Successfully authenticated as regular user');
            } catch (userError) {
                console.error('❌ Both admin and user authentication failed');
                console.error('Admin error:', adminError);
                console.error('User error:', userError);
                throw adminError;
            }
        }
    }

    async readCSVFile(): Promise<CutoffRecord[]> {
        return new Promise((resolve, reject) => {
            const records: CutoffRecord[] = [];

            createReadStream(this.csvFilePath)
                .pipe(parse({
                    columns: true,
                    skip_empty_lines: true,
                    trim: true
                }))
                .on('data', (row) => {
                    // Convert total_admitted to number
                    const record: CutoffRecord = {
                        ...row,
                        total_admitted: parseInt(row.total_admitted) || 0
                    };
                    records.push(record);
                })
                .on('end', () => {
                    console.log(`📊 Read ${records.length} records from CSV`);
                    resolve(records);
                })
                .on('error', (error) => {
                    console.error('❌ Error reading CSV file:', error);
                    reject(error);
                });
        });
    }

    async uploadRecords(records: CutoffRecord[]) {
        console.log(`🚀 Starting upload of ${records.length} records...`);

        let successCount = 0;
        let errorCount = 0;
        const batchSize = 100; // Process in batches to avoid overwhelming the server

        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1} (records ${i + 1}-${Math.min(i + batchSize, records.length)})`);

            const batchPromises = batch.map(async (record, index) => {
                try {
                    await this.pb.collection(this.collectionName).create(record);
                    successCount++;

                    // Log progress every 500 records
                    if ((i + index + 1) % 500 === 0) {
                        console.log(`✅ Uploaded ${i + index + 1} records...`);
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Error uploading record ${i + index + 1}:`, error);
                    console.error('Record data:', record);
                }
            });

            // Wait for current batch to complete before processing next batch
            await Promise.all(batchPromises);

            // Add a small delay between batches to be respectful to the server
            if (i + batchSize < records.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log(`\n📈 Upload Summary:`);
        console.log(`✅ Successfully uploaded: ${successCount} records`);
        console.log(`❌ Failed uploads: ${errorCount} records`);
        console.log(`📊 Total processed: ${records.length} records`);
    }

    async checkCollectionExists(): Promise<boolean> {
        try {
            await this.pb.collection(this.collectionName).getList(1, 1);
            return true;
        } catch (error) {
            return false;
        }
    }

    async run() {
        try {
            console.log('🚀 Starting MHT-CET Cutoffs Upload Process...\n');

            // Step 1: Authenticate
            console.log('🔐 Authenticating...');
            await this.authenticate();

            // Step 2: Check if collection exists
            console.log('🔍 Checking collection...');
            const collectionExists = await this.checkCollectionExists();
            if (!collectionExists) {
                console.error(`❌ Collection '${this.collectionName}' does not exist. Please create it first.`);
                return;
            }
            console.log(`✅ Collection '${this.collectionName}' found`);

            // Step 3: Read CSV file
            console.log('📖 Reading CSV file...');
            const records = await this.readCSVFile();

            // Step 4: Upload records
            console.log('⬆️  Starting upload...');
            await this.uploadRecords(records);

            console.log('\n🎉 Upload process completed!');

        } catch (error) {
            console.error('💥 Fatal error during upload process:', error);
            process.exit(1);
        }
    }
}

// Run the uploader if this file is executed directly
if (require.main === module) {
    const uploader = new MHTCETCutoffUploader();
    uploader.run();
}

export default MHTCETCutoffUploader;
