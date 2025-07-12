const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_PROJECT_URL');
  console.error('   - SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function bulkApproveUsers() {
  try {
    console.log('🔄 Starting bulk user approval...\n');

    // Get all pending users (not approved and not rejected)
    const { data: pendingUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, email, full_name, created_at, is_approved, approval_status')
      .or('is_approved.is.null,is_approved.eq.false')
      .neq('approval_status', 'rejected');

    if (fetchError) {
      console.error('❌ Error fetching pending users:', fetchError);
      return;
    }

    if (!pendingUsers || pendingUsers.length === 0) {
      console.log('✅ No pending users found to approve.');
      return;
    }

    console.log(`📊 Found ${pendingUsers.length} pending users to approve:\n`);

    // Display users that will be approved
    pendingUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name || 'No name'} (${user.email}) - Created: ${new Date(user.created_at).toLocaleDateString()}`);
    });

    console.log('\n⚠️  WARNING: This will approve ALL pending users without sending notification emails.');
    console.log('   This action cannot be undone.\n');

    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question('Do you want to continue? (yes/no): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled.');
      return;
    }

    console.log('\n🔄 Approving users...\n');

    // Update users one by one to avoid complex query issues
    const updatedUsers = [];
    for (const user of pendingUsers) {
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          is_approved: true,
          approval_status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select('id, email, full_name')
        .single();

      if (updateError) {
        console.error(`❌ Error updating user ${user.email}:`, updateError);
        continue;
      }

      updatedUsers.push(updatedUser);
      console.log(`✅ Approved: ${user.full_name || 'No name'} (${user.email})`);
    }

    console.log(`\n✅ Successfully approved ${updatedUsers.length} out of ${pendingUsers.length} users!\n`);

    // Display approved users
    if (updatedUsers.length > 0) {
      console.log('Approved users:');
      updatedUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.full_name || 'No name'} (${user.email})`);
      });
    }

    console.log('\n🎉 Bulk approval completed successfully!');
    console.log('   Note: No notification emails were sent to the users.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
bulkApproveUsers()
  .then(() => {
    console.log('\n✨ Script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 