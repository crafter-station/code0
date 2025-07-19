import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Setup script for code0 MVP
 */
async function setup() {
  console.log('🚀 code0 Setup Wizard\n');

  try {
    // Check if config.js already exists
    const configPath = path.join(__dirname, 'config.js');
    
    try {
      await fs.access(configPath);
      console.log('✅ config.js already exists');
      
      // Validate existing config
      const { config } = await import('./config.js');
      
      const hasValidCodesandbox = config.CODESANDBOX_API_KEY && 
        config.CODESANDBOX_API_KEY !== 'your_codesandbox_api_key_here';
      
      const hasValidGithub = config.GITHUB_TOKEN && 
        config.GITHUB_TOKEN !== 'your_github_personal_access_token_here';

      console.log('\n📋 Configuration Status:');
      console.log(`   CodeSandbox API Key: ${hasValidCodesandbox ? '✅ Configured' : '❌ Not configured'}`);
      console.log(`   GitHub Token: ${hasValidGithub ? '✅ Configured' : '❌ Not configured'}`);

      if (hasValidCodesandbox && hasValidGithub) {
        console.log('\n🎉 Setup complete! Your configuration is ready.');
        console.log('\n🚀 Quick start:');
        console.log('   npm run demo    # Run the demo');
        console.log('   npm start       # Run the main application');
        return;
      } else {
        console.log('\n⚠️  Please update config.js with your API keys:');
        if (!hasValidCodesandbox) {
          console.log('   • Get CodeSandbox API key: https://codesandbox.io/pro');
        }
        if (!hasValidGithub) {
          console.log('   • Get GitHub token: https://github.com/settings/tokens');
        }
        return;
      }

    } catch (error) {
      // config.js doesn't exist, create it
      console.log('📝 Creating config.js from template...');
      
      const exampleConfigPath = path.join(__dirname, 'config.example.js');
      const exampleConfig = await fs.readFile(exampleConfigPath, 'utf-8');
      
      await fs.writeFile(configPath, exampleConfig);
      console.log('✅ Created config.js');
    }

    console.log('\n🔧 Configuration Required:');
    console.log('');
    console.log('1. CodeSandbox API Key:');
    console.log('   • Visit: https://codesandbox.io/pro');
    console.log('   • Go to Account Settings > API Keys');
    console.log('   • Create a new API key');
    console.log('   • Add it to config.js');
    console.log('');
    console.log('2. GitHub Personal Access Token:');
    console.log('   • Visit: https://github.com/settings/tokens');
    console.log('   • Generate new token (classic)');
    console.log('   • Select scopes: repo, workflow');
    console.log('   • Add it to config.js');
    console.log('');
    console.log('📄 Edit config.js and replace the placeholder values with your actual API keys.');
    console.log('');
    console.log('🚀 After configuration, run:');
    console.log('   npm run demo    # Test the setup with a demo');
    console.log('   npm start       # Run the main application');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\nPlease check the error above and try again.');
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setup().catch(console.error);
}

export { setup }; 