/**
 * TEST AWS SNS CONFIGURATION
 * Quick script to verify AWS SNS is working
 */

const dotenv = require('dotenv');
dotenv.config();

const AWS = require('aws-sdk');

console.log('\n🔍 Testing AWS SNS Configuration...\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Check environment variables
console.log('Environment Variables:');
console.log(`  AWS_REGION: ${process.env.AWS_REGION || '❌ NOT SET'}`);
console.log(`  AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✅ SET' : '❌ NOT SET'}`);
console.log(`  AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ SET' : '❌ NOT SET'}`);
console.log(`  AWS_SNS_TOPIC_ARN: ${process.env.AWS_SNS_TOPIC_ARN || '❌ NOT SET'}\n`);

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.log('⚠️  AWS credentials not configured!');
  console.log('\n📝 To configure AWS SNS:');
  console.log('1. Go to AWS Console → IAM');
  console.log('2. Create a new user with SNS permissions');
  console.log('3. Generate access key');
  console.log('4. Update backend/.env file:\n');
  console.log('   AWS_REGION=ap-south-1');
  console.log('   AWS_ACCESS_KEY_ID=your_key_here');
  console.log('   AWS_SECRET_ACCESS_KEY=your_secret_here');
  console.log('   AWS_SNS_TOPIC_ARN=arn:aws:sns:ap-south-1:123456789012:PowerGrid-Alerts\n');
  console.log('5. Create SNS topic in AWS Console');
  console.log('6. Subscribe your phone (+91XXXXXXXXXX) or email\n');
  console.log('For full setup instructions, see backend/AWS_SNS_SETUP.md\n');
  process.exit(0);
}

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const sns = new AWS.SNS({ apiVersion: '2010-03-31' });

console.log('✅ AWS SDK configured!\n');
console.log('Testing SNS connection...\n');

// Test SNS connection by listing topics
sns.listTopics({}, (err, data) => {
  if (err) {
    console.error('❌ SNS Connection Failed!');
    console.error('Error:', err.message);
    console.log('\n💡 Common issues:');
    console.log('  - Invalid credentials');
    console.log('  - Wrong region');
    console.log('  - No SNS permissions');
    console.log('\nCheck your AWS IAM permissions and credentials.\n');
    process.exit(1);
  }

  console.log('✅ SNS Connection Successful!\n');
  console.log(`Found ${data.Topics.length} SNS topics in your account:\n`);

  if (data.Topics.length > 0) {
    data.Topics.forEach((topic, idx) => {
      console.log(`  ${idx + 1}. ${topic.TopicArn}`);
    });
    console.log('');
  } else {
    console.log('  No topics found. Create one in AWS Console.\n');
  }

  const configuredTopic = process.env.AWS_SNS_TOPIC_ARN;
  if (configuredTopic) {
    const topicExists = data.Topics.some(t => t.TopicArn === configuredTopic);
    if (topicExists) {
      console.log(`✅ Configured topic exists: ${configuredTopic}\n`);
    } else {
      console.log(`⚠️  Configured topic not found: ${configuredTopic}`);
      console.log('   Update AWS_SNS_TOPIC_ARN in .env with a valid topic ARN.\n');
    }
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ AWS SNS is ready to use!\n');
  console.log('🧪 Test the system:');
  console.log('   curl http://localhost:5000/api/alert/test\n');
  console.log('📖 Full documentation: backend/AWS_SNS_SETUP.md\n');
  process.exit(0);
});
