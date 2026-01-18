/**
 * Sample data seeder for development
 *
 * Usage:
 * 1. Set up your Firebase project and get credentials
 * 2. Run: node scripts/seed-data.js
 *
 * Or import sampleBriefing in your app for local testing
 */

const sampleBriefing = {
  date: new Date().toISOString().split('T')[0], // Today's date
  actionItems: [
    {
      task: "Submit Problem Set 3 for CS 161",
      priority: 1,
      course: "CS 161",
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Tomorrow
    },
    {
      task: "Review lecture notes for midterm",
      priority: 1,
      course: "MATH 51",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      task: "Start working on lab report",
      priority: 2,
      course: "PHYS 41",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      task: "Read Chapter 7 before section",
      priority: 3,
      course: "ECON 1",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  ],
  assignments: [
    {
      title: "Problem Set 3: Dynamic Programming",
      course: "CS 161",
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      url: "https://canvas.stanford.edu/courses/12345/assignments/1"
    },
    {
      title: "Midterm Study Guide",
      course: "MATH 51",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      url: "https://canvas.stanford.edu/courses/12346/assignments/2"
    },
    {
      title: "Lab 4: Oscillations",
      course: "PHYS 41",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      url: "https://canvas.stanford.edu/courses/12347/assignments/3"
    },
    {
      title: "Reading Response Week 6",
      course: "ECON 1",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: "submitted",
      url: "https://canvas.stanford.edu/courses/12348/assignments/4"
    },
    {
      title: "Problem Set 2: Graph Algorithms",
      course: "CS 161",
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: "submitted",
      url: "https://canvas.stanford.edu/courses/12345/assignments/0"
    }
  ],
  announcements: [
    {
      course: "CS 161",
      title: "Office hours moved to Thursday",
      content: "Due to the upcoming holiday, my office hours this week will be moved from Wednesday to Thursday, same time (3-5pm). The room remains the same (Gates 159).",
      date: new Date().toISOString().split('T')[0]
    },
    {
      course: "CS 161",
      title: "Midterm review session",
      content: "There will be a midterm review session this Saturday from 2-5pm in Hewlett 200. We'll go over practice problems and answer any questions about the material.",
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      course: "MATH 51",
      title: "Exam logistics reminder",
      content: "The midterm will be held next Tuesday during regular class time. Please bring a blue book and pencils. Calculators are NOT allowed. You may bring one 8.5x11 sheet of handwritten notes (both sides).",
      date: new Date().toISOString().split('T')[0]
    },
    {
      course: "PHYS 41",
      title: "Lab section change",
      content: "Lab sections are being reorganized. Please check the new schedule on Canvas and sign up for your preferred time slot by Friday.",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  ],
  edPosts: [
    {
      course: "CS 161",
      title: "[IMPORTANT] Clarification on Problem 3.2",
      isStaff: true,
      isPinned: true,
      url: "https://edstem.org/us/courses/12345/discussion/1"
    },
    {
      course: "CS 161",
      title: "Recurrence relation for merge sort variant",
      isStaff: false,
      isPinned: false,
      url: "https://edstem.org/us/courses/12345/discussion/2"
    },
    {
      course: "CS 161",
      title: "Study group for midterm - Saturday 10am",
      isStaff: false,
      isPinned: false,
      url: "https://edstem.org/us/courses/12345/discussion/3"
    },
    {
      course: "MATH 51",
      title: "Solutions to Practice Midterm 2",
      isStaff: true,
      isPinned: true,
      url: "https://edstem.org/us/courses/12346/discussion/1"
    },
    {
      course: "MATH 51",
      title: "Question about eigenvalue problem",
      isStaff: false,
      isPinned: false,
      url: "https://edstem.org/us/courses/12346/discussion/2"
    }
  ],
  gradescope: [
    {
      assignment: "Problem Set 2: Graph Algorithms",
      course: "CS 161",
      status: "graded",
      score: "47/50"
    },
    {
      assignment: "Problem Set 1: Divide & Conquer",
      course: "CS 161",
      status: "graded",
      score: "50/50"
    },
    {
      assignment: "Homework 5",
      course: "MATH 51",
      status: "submitted",
      score: null
    },
    {
      assignment: "Lab 3: Projectile Motion",
      course: "PHYS 41",
      status: "graded",
      score: "28/30"
    },
    {
      assignment: "Problem Set 3: Dynamic Programming",
      course: "CS 161",
      status: "pending",
      score: null
    }
  ]
};

// For use with Firebase Admin SDK
async function seedFirestore() {
  try {
    // This would require firebase-admin to be set up
    // const admin = require('firebase-admin');
    // const serviceAccount = require('./serviceAccountKey.json');
    // admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    // const db = admin.firestore();
    // await db.collection('briefings').doc(sampleBriefing.date).set(sampleBriefing);
    console.log('Sample briefing data:');
    console.log(JSON.stringify(sampleBriefing, null, 2));
    console.log('\nTo seed this data, use the Firebase console or the submitBriefing function.');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

// Export for use in the app during development
module.exports = { sampleBriefing };

// Run if called directly
if (require.main === module) {
  seedFirestore();
}
