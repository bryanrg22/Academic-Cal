import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';

// Demo mode - set to true to use sample data without Firebase
const DEMO_MODE = !import.meta.env.VITE_FIREBASE_PROJECT_ID;

// Sample data for demo/development
const sampleBriefing = {
  id: new Date().toISOString().split('T')[0],
  date: new Date().toISOString().split('T')[0],
  summary: {
    overall: "You have a busy week ahead with Problem Set 3 due tomorrow and a MATH 51 midterm coming up. Focus on finishing the PS3 today and start reviewing for the midterm.",
    courses: {
      "CS-161": "Problem Set 3 on dynamic programming is due tomorrow. Office hours moved to Thursday.",
      "MATH-51": "Midterm next Tuesday - review session Saturday 2-5pm. No calculators allowed.",
      "PHYS-41": "Lab 4 on oscillations due in 5 days. Lab sections being reorganized.",
      "ECON-1": "Reading response submitted. Chapter 7 reading due before section."
    }
  },
  actionItems: [
    {
      task: "Submit Problem Set 3 for CS 161",
      priority: 1,
      course: "CS 161",
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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
      url: "#"
    },
    {
      title: "Midterm Study Guide",
      course: "MATH 51",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      url: "#"
    },
    {
      title: "Lab 4: Oscillations",
      course: "PHYS 41",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      url: "#"
    },
    {
      title: "Reading Response Week 6",
      course: "ECON 1",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: "submitted",
      url: "#"
    },
    {
      title: "Problem Set 2: Graph Algorithms",
      course: "CS 161",
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: "submitted",
      url: "#"
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
      content: "The midterm will be held next Tuesday during regular class time. Please bring a blue book and pencils. Calculators are NOT allowed.",
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
      url: "#"
    },
    {
      course: "CS 161",
      title: "Recurrence relation for merge sort variant",
      isStaff: false,
      isPinned: false,
      url: "#"
    },
    {
      course: "CS 161",
      title: "Study group for midterm - Saturday 10am",
      isStaff: false,
      isPinned: false,
      url: "#"
    },
    {
      course: "MATH 51",
      title: "Solutions to Practice Midterm 2",
      isStaff: true,
      isPinned: true,
      url: "#"
    },
    {
      course: "MATH 51",
      title: "Question about eigenvalue problem",
      isStaff: false,
      isPinned: false,
      url: "#"
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

/**
 * Hook to fetch the latest briefing or a specific date's briefing
 * @param {string|null} date - Optional date (YYYY-MM-DD) to fetch specific briefing
 * @returns {{ briefing: object|null, loading: boolean, error: Error|null }}
 */
export function useBriefing(date = null) {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe = () => {};

    const fetchBriefing = async () => {
      setLoading(true);
      setError(null);

      // Use demo data if Firebase isn't configured
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
        if (date && date !== sampleBriefing.date) {
          setBriefing(null);
        } else {
          setBriefing(sampleBriefing);
        }
        setLoading(false);
        return;
      }

      try {
        if (date) {
          // Fetch specific date
          const docRef = doc(db, 'briefings', date);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setBriefing({ id: docSnap.id, ...docSnap.data() });
          } else {
            setBriefing(null);
          }
        } else {
          // Fetch latest briefing with real-time updates
          const q = query(
            collection(db, 'briefings'),
            orderBy('date', 'desc'),
            limit(1)
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
              const doc = snapshot.docs[0];
              setBriefing({ id: doc.id, ...doc.data() });
            } else {
              setBriefing(null);
            }
            setLoading(false);
          }, (err) => {
            console.error('Error fetching briefing:', err);
            setError(err);
            setLoading(false);
          });

          return; // Skip the setLoading(false) below since onSnapshot handles it
        }
      } catch (err) {
        console.error('Error fetching briefing:', err);
        setError(err);
      }

      setLoading(false);
    };

    fetchBriefing();

    return () => unsubscribe();
  }, [date]);

  return { briefing, loading, error };
}

/**
 * Hook to fetch all briefings for the history page
 * @returns {{ briefings: array, loading: boolean, error: Error|null }}
 */
export function useBriefingHistory() {
  const [briefings, setBriefings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBriefings = async () => {
      setLoading(true);
      setError(null);

      // Use demo data if Firebase isn't configured
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
        // Create a few days of sample data for history
        const today = new Date();
        const sampleHistory = [
          { ...sampleBriefing },
          {
            ...sampleBriefing,
            id: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            date: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          {
            ...sampleBriefing,
            id: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        ];
        setBriefings(sampleHistory);
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'briefings'),
          orderBy('date', 'desc')
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setBriefings(data);
      } catch (err) {
        console.error('Error fetching briefing history:', err);
        setError(err);
      }

      setLoading(false);
    };

    fetchBriefings();
  }, []);

  return { briefings, loading, error };
}
