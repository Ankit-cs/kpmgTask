import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.doubtResponse.deleteMany();
  await prisma.doubt.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.testCase.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.tokenUsage.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding data...');

  // Create Users
  const teacher = await prisma.user.create({
    data: {
      name: 'Dr. Smith',
      email: 'teacher@kpmg.com',
      role: 'TEACHER',
    },
  });

  const student = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'student@kpmg.com',
      role: 'STUDENT',
    },
  });

  // Create Assignment
  const assignment = await prisma.assignment.create({
    data: {
      title: 'Two Sum',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      testCases: {
        create: [
          {
            input: '[2,7,11,15]\n9',
            expectedOut: '[0, 1]',
          },
          {
            input: '[3,2,4]\n6',
            expectedOut: '[1, 2]',
          }
        ]
      }
    }
  });

  // Create Submission
  const submission = await prisma.submission.create({
    data: {
      studentId: student.id,
      assignmentId: assignment.id,
      code: 'function twoSum(nums, target) {\n  for(let i=0; i<nums.length; i++) {\n    for(let j=i+1; j<nums.length; j++) {\n      if(nums[i]+nums[j]===target) return [i,j];\n    }\n  }\n}',
      language: 'javascript',
      status: 'Accepted',
      executionLedger: {
        tests: [
          { passed: true, output: '[0, 1]', expected: '[0, 1]' },
          { passed: true, output: '[1, 2]', expected: '[1, 2]' }
        ]
      },
      codeFeedback: 'Good approach, time complexity is O(n^2), consider using a HashMap for O(n).',
    }
  });

  // Create Doubt
  const doubt = await prisma.doubt.create({
    data: {
      studentId: student.id,
      content: 'Can someone explain how to optimize the Two Sum problem to O(n)?',
      responses: {
        create: [
          {
            author: 'AI',
            content: 'You can use a hash map to store the values and their indices. As you iterate, check if the complement (target - current value) exists in the map.',
            status: 'APPROVED'
          }
        ]
      }
    }
  });

  // Create Token Usage
  await prisma.tokenUsage.create({
    data: {
      studentId: student.id,
      assignmentId: assignment.id,
      inputTokens: 150,
      outputTokens: 50,
      action: 'CodeReview'
    }
  });

  console.log('Seeding finished successfully.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
