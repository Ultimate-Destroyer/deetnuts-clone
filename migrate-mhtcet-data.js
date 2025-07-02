// migrate-mhtcet-data.js
// Script to migrate MHT-CET state cutoffs data from Supabase to PocketBase
const { createClient } = require('@supabase/supabase-js');
// Fix the PocketBase import
const PocketBase = require('pocketbase/cjs');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.migration
require('dotenv').config({ path: '.env.migration' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize PocketBase client
const pb = new PocketBase('http://127.0.0.1:8090');

// Function to authenticate with PocketBase (admin)
async function authenticatePocketBase() {
  try {
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL,
      process.env.POCKETBASE_ADMIN_PASSWORD
    );
    console.log('Authenticated with PocketBase as admin');
  } catch (error) {
    console.error('PocketBase authentication failed:', error);
    process.exit(1);
  }
}

// Function to fetch data from Supabase
async function fetchFromSupabase(tableName) {
  console.log(`Fetching data from Supabase table: ${tableName}`);
  
  const { data, error } = await supabase
    .from(tableName)
    .select('*');
  
  if (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
    return [];
  }
  
  console.log(`Successfully fetched ${data.length} records from ${tableName}`);
  return data;
}

// Function to convert Supabase record to PocketBase format
function convertRecord(record) {
  return {
    College_ID: record.ID?.toString(),
    College: record.College,
    City: record.City,
    Branch_id: record.Branch_id,
    Branch: record.Branch,
    Status: record.Status,
    Allocation: record.Allocation,
    Category: record.Category,
    Cutoff: record.Cutoff?.toString(),
    Percentile: record.Percentile?.toString()
  };
}

// Function to upload data to PocketBase
async function uploadToPocketBase(collectionName, data) {
  console.log(`Uploading ${data.length} records to PocketBase collection: ${collectionName}`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const record of data) {
    try {
      const pbRecord = convertRecord(record);
      await pb.collection(collectionName).create(pbRecord);
      successCount++;
      
      // Log progress every 50 records
      if (successCount % 50 === 0) {
        console.log(`Progress: ${successCount} records uploaded`);
      }
    } catch (error) {
      console.error(`Error uploading record:`, error);
      errorCount++;
    }
  }
  
  console.log(`Upload complete: ${successCount} records successfully uploaded, ${errorCount} failed`);
}

// Main migration function
async function migrateData() {
  try {
    // Authenticate with PocketBase
    await authenticatePocketBase();
    
    // Define migration mapping (Supabase table name -> PocketBase collection name)
    const migrationMap = [
      {
        supabaseTable: '2023-round-one-pcm-mhtcet-state-cutoffs',
        pocketbaseCollection: 'engineering_pcm_mhtcet_state_cutoffs_2023_round_one'
      },
      {
        supabaseTable: '2023-round-two-pcm-mhtcet-state-cutoffs',
        pocketbaseCollection: 'engineering_pcm_mhtcet_state_cutoffs_2023_round_two'
      },
      {
        supabaseTable: '2023-round-three-pcm-mhtcet-state-cutoffs',
        pocketbaseCollection: 'engineering_pcm_mhtcet_state_cutoffs_2023_round_three'
      }
    ];
    
    // Process each migration
    for (const migration of migrationMap) {
      console.log(`\nStarting migration: ${migration.supabaseTable} → ${migration.pocketbaseCollection}`);
      
      // Fetch data from Supabase
      const data = await fetchFromSupabase(migration.supabaseTable);
      
      if (data.length === 0) {
        console.log(`No data found in ${migration.supabaseTable}, skipping...`);
        continue;
      }
      
      // Upload data to PocketBase
      await uploadToPocketBase(migration.pocketbaseCollection, data);
      
      console.log(`Migration completed for ${migration.supabaseTable} → ${migration.pocketbaseCollection}`);
    }
    
    console.log('\nAll migrations completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Execute the migration
migrateData().catch(error => {
  console.error('Unhandled error during migration:', error);
  process.exit(1);
});