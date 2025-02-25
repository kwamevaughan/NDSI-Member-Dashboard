// Run this in a one-off script or console (e.g., node script.js)
const bcrypt = require('bcrypt');

async function createTestUser() {
    const hashedPassword = await bcrypt.hash('testpassword123', 10); // Salt rounds: 10
    const { error } = await supabase.from('users').insert({
        email: 'test@example.com',
        password: hashedPassword,
        first_name: 'Test',
        last_name: 'User',
    });
    console.log(error || 'User created');
}

createTestUser();