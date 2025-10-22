// Simple test to check if sponsorAPI router can be loaded
console.log('Testing sponsorAPI router loading...');

try {
    const sponsorAPI = require('./DB_API/sponsorAPI');
    console.log('sponsorAPI loaded successfully:', typeof sponsorAPI);
    console.log('sponsorAPI.router:', typeof sponsorAPI.router);
    
    if (sponsorAPI.router && sponsorAPI.router.stack) {
        console.log('Router has', sponsorAPI.router.stack.length, 'routes');
    }
} catch (error) {
    console.error('Error loading sponsorAPI:', error);
}
