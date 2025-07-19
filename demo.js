import { Code0Agent } from './src/index.js';
import { config } from './config.js';

/**
 * Demo script showing how to use the code0 agent
 */
async function runDemo() {
  console.log('🤖 code0 Agent Demo\n');

  // Validate configuration
  if (!config.CODESANDBOX_API_KEY || config.CODESANDBOX_API_KEY === 'your_codesandbox_api_key_here') {
    console.error('❌ CODESANDBOX_API_KEY not configured in config.js');
    console.log('💡 Please copy config.example.js to config.js and add your API key');
    process.exit(1);
  }

  if (!config.GITHUB_TOKEN || config.GITHUB_TOKEN === 'your_github_personal_access_token_here') {
    console.error('❌ GITHUB_TOKEN not configured in config.js');
    console.log('💡 Please copy config.example.js to config.js and add your GitHub token');
    process.exit(1);
  }

  // For the demo, we'll use the current local repository
  // Note: For actual PR creation, you need push access to the repository
  const repoUrl = 'https://github.com/cuevaio/maestrogpt'; // Change this to your own repo for real PR creation
  const task = 'Create hello.js file with console.log("hello from code0") and validate it works';

  console.log('📋 Demo Configuration:');
  console.log(`   Repository: ${repoUrl}`);
  console.log(`   Task: ${task}`);
  console.log('');

  try {
    const agent = new Code0Agent();
    console.log('✅ Code0Agent initialized successfully');
    
    const result = await agent.executeTask(repoUrl, task);

    if (result.success) {
      console.log('\n🎉 DEMO COMPLETED SUCCESSFULLY!');
      console.log('═'.repeat(50));
      console.log(`📦 Sandbox ID: ${result.sandbox}`);
      console.log(`🔗 Pull Request: ${result.pullRequest}`);
      console.log('');
      console.log('✅ The agent successfully:');
      console.log('   • Created a CodeSandbox environment');
      console.log('   • Cloned the repository');
      console.log('   • Created hello.js file');
      console.log('   • Validated the file works');
      console.log('   • Submitted a pull request');
      console.log('');
      console.log('🚀 Check the pull request link above to see the changes!');
    } else {
      console.log('\n❌ DEMO FAILED');
      console.log('═'.repeat(30));
      console.log(`🚨 Error: ${result.error}`);
      console.log('');
      console.log('💡 Common issues:');
      console.log('   • Invalid API keys');
      console.log('   • Network connectivity');
      console.log('   • Repository permissions');
      console.log('   • CodeSandbox service unavailable');
    }

  } catch (error) {
    console.error('\n💥 UNEXPECTED ERROR');
    console.error('═'.repeat(30));
    console.error(`🚨 ${error.message}`);
    console.error('');
    console.error('🔍 Stack trace:');
    console.error(error.stack);
  }
}

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}

export { runDemo }; 