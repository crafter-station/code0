import { CodeSandbox } from '@codesandbox/sdk';
import { Octokit } from '@octokit/rest';
import simpleGit from 'simple-git';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';

class Code0Agent {
  constructor() {
    // Validate configuration
    if (!config.CODESANDBOX_API_KEY || config.CODESANDBOX_API_KEY === 'your_codesandbox_api_key_here') {
      throw new Error('CODESANDBOX_API_KEY not configured. Please run "npm run setup" and add your API key to config.js');
    }
    
    if (!config.GITHUB_TOKEN || config.GITHUB_TOKEN === 'your_github_personal_access_token_here') {
      throw new Error('GITHUB_TOKEN not configured. Please run "npm run setup" and add your GitHub token to config.js');
    }

    this.codesandbox = new CodeSandbox(config.CODESANDBOX_API_KEY);
    
    this.github = new Octokit({
      auth: config.GITHUB_TOKEN
    });
  }

  /**
   * Main function to execute the code0 task
   * @param {string} repoUrl - GitHub repository URL
   * @param {string} task - Task description
   */
  async executeTask(repoUrl, task) {
    console.log(`🚀 Starting code0 agent...`);
    console.log(`📋 Task: ${task}`);
    console.log(`🔗 Repository: ${repoUrl}`);

    try {
      // Parse repository info from URL
      const repoInfo = this.parseRepoUrl(repoUrl);
      console.log(`📁 Repository: ${repoInfo.owner}/${repoInfo.repo}`);

      // Create a CodeSandbox environment
      const sandbox = await this.createSandbox(repoInfo);
      console.log(`📦 Created sandbox: ${sandbox.id}`);

      // Clone the repository and execute all tasks in sequence
      await this.cloneRepository(sandbox, repoUrl);
      console.log(`📥 Cloned repository successfully`);

      // List files to see what's in the repository
      await this.listFiles('📁 Repository contents after clone:', sandbox);

      // Execute the specific task (create hello.js) and validate immediately
      const validationResult = await this.createAndValidateHelloFile(sandbox);
      console.log(`✅ Validation result:`, validationResult);

      // List files again to see the new hello.js file
      await this.listFiles('📁 Repository contents after creating hello.js:', sandbox);

              if (validationResult.success) {
        // Create and submit PR
        const prResult = await this.createPullRequest(sandbox, repoInfo, task);
        console.log(`🎉 Pull Request created: ${prResult.html_url}`);
        
        // Clean up session
        await this.cleanup();
        
        return {
          success: true,
          sandbox: sandbox.id,
          pullRequest: prResult.html_url
        };
      } else {
        await this.cleanup();
        throw new Error(`Validation failed: ${validationResult.error}`);
      }

    } catch (error) {
      console.error(`❌ Error executing task:`, error.message);
      await this.cleanup();
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse GitHub repository URL
   */
  parseRepoUrl(url) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }
    return {
      owner: match[1],
      repo: match[2].replace('.git', '')
    };
  }

  /**
   * Create a CodeSandbox environment
   */
  async createSandbox(repoInfo) {
    // Create a basic sandbox (uses default template)
    const sandbox = await this.codesandbox.sandboxes.create();

    return sandbox;
  }

  /**
   * Clone repository in the sandbox
   */
  async cloneRepository(sandbox, repoUrl) {
    // Connect to the sandbox
    const session = await sandbox.connect();
    this.session = session; // Store for later use
    
    // Check if git is available first
    try {
      await session.commands.run('git --version');
      console.log('📋 Git is already available');
    } catch (error) {
      console.log('📦 Installing git...');
      // Try to install git - use simpler approach
      await session.commands.run('apt-get update');
      await session.commands.run('apt-get install -y git');
    }
    
    // Clone the repository
    await session.commands.run(`git clone ${repoUrl} /workspace/repo`);
    
    return session;
  }

  /**
   * Create hello.js file with the required content
   */
  async createHelloFile(sandbox) {
    const helloContent = 'console.log("hello from code0");';
    
    // Create the hello.js file in the repository using echo command
    await this.session.commands.run(`echo '${helloContent}' > /workspace/repo/hello.js`);
    
    console.log(`📄 Created hello.js with content: ${helloContent}`);
  }

    /**
   * Create hello.js file and validate it immediately in the same session
   */
  async createAndValidateHelloFile(sandbox) {
    const helloContent = 'console.log("hello from code0");';
    
    try {
      // Ensure we have an active session
      if (!this.session) {
        console.log('🔄 Reconnecting session for file creation...');
        this.session = await sandbox.connect();
      }

      // Create the file
      await this.session.commands.run(`echo '${helloContent}' > /workspace/repo/hello.js`);
      console.log(`📄 Created hello.js file`);
      
      // Validate by running the file
      const result = await this.session.commands.run('cd /workspace/repo && node hello.js');
      console.log(`📝 File executed successfully`);
      
      if (result.includes('hello from code0')) {
        return {
          success: true,
          output: result.trim()
        };
      } else {
        return {
          success: false,
          error: `Expected "hello from code0" but got: ${result}`
        };
      }
    } catch (error) {
      // Try to reconnect and retry once
      try {
        console.log('🔄 Session lost during file creation, reconnecting...');
        this.session = await sandbox.connect();
        
        // Retry file creation and validation
        await this.session.commands.run(`echo '${helloContent}' > /workspace/repo/hello.js`);
        console.log(`📄 Created hello.js file (retry)`);
        
        const result = await this.session.commands.run('cd /workspace/repo && node hello.js');
        console.log(`📝 File executed successfully (retry)`);
        
        if (result.includes('hello from code0')) {
          return {
            success: true,
            output: result.trim()
          };
        } else {
          return {
            success: false,
            error: `Expected "hello from code0" but got: ${result}`
          };
        }
      } catch (retryError) {
        return {
          success: false,
          error: `Failed to create and validate hello.js: ${retryError.message}`
        };
      }
    }
  }

  /**
   * List files in the repository with description
   */
  async listFiles(description, sandbox = null) {
    try {
      console.log(description);
      
      // If session is lost, try to reconnect
      if (!this.session && sandbox) {
        console.log('🔄 Reconnecting session for file listing...');
        this.session = await sandbox.connect();
      }
      
      if (this.session) {
        const result = await this.session.commands.run('cd /workspace/repo && ls -la');
        console.log(result);
      } else {
        console.log('❌ No active session available for file listing');
      }
    } catch (error) {
      console.log(`❌ Could not list files: ${error.message}`);
    }
  }

  /**
   * Clean up session resources
   */
  async cleanup() {
    try {
      if (this.session) {
        // Just clear the session reference - CodeSandbox will handle cleanup
        this.session = null;
        console.log('🧹 Session cleaned up');
      }
    } catch (error) {
      console.log(`⚠️ Cleanup warning: ${error.message}`);
    }
  }

  /**
   * Validate that hello.js works correctly
   */
  async validateHelloFile(sandbox) {
    try {
      // Reconnect to ensure session is active
      if (!this.session) {
        this.session = await sandbox.connect();
      }

      // Run the hello.js file and capture output
      const result = await this.session.commands.run('cd /workspace/repo && node hello.js');
      
      if (result.includes('hello from code0')) {
        return {
          success: true,
          output: result.trim()
        };
      } else {
        return {
          success: false,
          error: `Expected "hello from code0" but got: ${result}`
        };
      }
    } catch (error) {
      // If session is lost, try to reconnect and retry once
      try {
        console.log('🔄 Session lost, reconnecting...');
        this.session = await sandbox.connect();
        const result = await this.session.commands.run('cd /workspace/repo && node hello.js');
        
        if (result.includes('hello from code0')) {
          return {
            success: true,
            output: result.trim()
          };
        } else {
          return {
            success: false,
            error: `Expected "hello from code0" but got: ${result}`
          };
        }
      } catch (retryError) {
        return {
          success: false,
          error: `Failed to run hello.js: ${retryError.message}`
        };
      }
    }
  }

  /**
   * Create a pull request with the changes
   */
  async createPullRequest(sandbox, repoInfo, task) {
    const branchName = `code0/add-hello-js-${Date.now()}`;
    
    try {
            // Do all git operations and push to remote
      const gitCommands = `
        cd /workspace/repo &&
        git config user.name "code0-agent" &&
        git config user.email "code0@example.com" &&
        git checkout -b ${branchName} &&
        git add hello.js &&
        git commit -m "Add hello.js - code0 automated task" &&
        git push origin ${branchName} &&
        cat hello.js
      `;
      
      const result = await this.session.commands.run(gitCommands);
      console.log('📋 Git operations and push completed successfully');
      
      // Extract just the file content from the command output (last line)
      const lines = result.trim().split('\n');
      const actualFileContent = lines[lines.length - 1];
      
      console.log(`📤 Pushed branch: ${branchName}`);

      // For the MVP, we'll create the PR via GitHub API
      // In a real implementation, you'd push the branch first
      const prTitle = 'Add hello.js file - Automated by code0';
      const prBody = `
## 🤖 Automated PR by code0

**Task:** ${task}

### Changes Made:
- ✅ Created \`hello.js\` file
- ✅ Added console.log("hello from code0")
- ✅ Validated output in console

### File Content:
\`\`\`javascript
${actualFileContent}
\`\`\`

### Validation Results:
The file was successfully created and tested. Running \`node hello.js\` produces the expected output: "hello from code0"

---
*This PR was automatically created by the code0 agent using Together Code Sandbox.*
      `.trim();

      console.log('🚀 Creating actual Pull Request...');
      
      // Create the PR using GitHub API
      const pr = await this.github.rest.pulls.create({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        title: prTitle,
        body: prBody,
        head: branchName,
        base: 'main' // or 'master', depending on the repo
      });

      // Log PR details
      console.log('📝 PR Created Successfully:');
      console.log(`   Title: ${prTitle}`);
      console.log(`   Branch: ${branchName}`);
      console.log(`   PR Number: #${pr.data.number}`);
      console.log(`   File: hello.js`);
      console.log(`   Content: ${actualFileContent}`);

      return pr.data;
    } catch (error) {
      throw new Error(`Failed to create pull request: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  const repoUrl = 'https://github.com/crafter-station/code0';
  const task = 'Create hello.js file with console.log("hello from code0") and validate it works';

  const agent = new Code0Agent();
  const result = await agent.executeTask(repoUrl, task);

  if (result.success) {
    console.log(`\n🎉 SUCCESS!`);
    console.log(`📦 Sandbox: ${result.sandbox}`);
    console.log(`🔗 Pull Request: ${result.pullRequest}`);
  } else {
    console.log(`\n❌ FAILED!`);
    console.log(`🚨 Error: ${result.error}`);
  }
}

// Run the application only if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}` && config.NODE_ENV !== 'test') {
  main().catch(console.error);
}

export { Code0Agent }; 