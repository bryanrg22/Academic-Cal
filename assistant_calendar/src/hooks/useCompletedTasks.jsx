import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

// Check if we're in demo mode (no Firebase configured)
const DEMO_MODE = !import.meta.env.VITE_FIREBASE_PROJECT_ID;

// localStorage key for fallback/migration
const STORAGE_KEY = 'completedTasks';

/**
 * Generate a unique task ID from task properties
 * This ensures the same task gets the same ID across sessions
 */
export function getTaskId(item) {
  // Create a unique ID from task properties
  const base = `${item.task || item.title || ''}-${item.course || ''}-${item.dueDate || ''}`;
  // Replace characters that aren't valid in Firestore document IDs
  return base.replace(/[\/\.\#\$\[\]]/g, '_');
}

// Context
const CompletedTasksContext = createContext(null);

export function CompletedTasksProvider({ children }) {
  const [completedTasks, setCompletedTasks] = useState({});
  const [loading, setLoading] = useState(true);

  // Set up real-time listener for completedTasks collection
  useEffect(() => {
    // In demo mode, use localStorage
    if (DEMO_MODE) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setCompletedTasks(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Error loading from localStorage:', e);
      }
      setLoading(false);
      return;
    }

    // Subscribe to Firestore completedTasks collection
    const unsubscribe = onSnapshot(
      collection(db, 'completedTasks'),
      (snapshot) => {
        const tasks = {};
        snapshot.forEach(doc => {
          const data = doc.data();
          // Store the timestamp (as milliseconds) for each completed task
          tasks[doc.id] = data.completedAt?.toMillis() || Date.now();
        });
        setCompletedTasks(tasks);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching completed tasks:', error);
        // Fall back to localStorage on error
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            setCompletedTasks(JSON.parse(stored));
          }
        } catch (e) {
          console.error('Error loading from localStorage:', e);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync to localStorage as backup (in demo mode or as fallback)
  useEffect(() => {
    if (Object.keys(completedTasks).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedTasks));
    }
  }, [completedTasks]);

  const isCompleted = useCallback((taskId) => {
    return !!completedTasks[taskId];
  }, [completedTasks]);

  const toggleTask = useCallback(async (taskId, completed, briefingDate = null, itemType = 'actionItem') => {
    // Optimistic update for immediate UI feedback
    setCompletedTasks(prev => {
      const next = { ...prev };
      if (completed) {
        next[taskId] = Date.now();
      } else {
        delete next[taskId];
      }
      return next;
    });

    // In demo mode, only use localStorage (already updated via useEffect)
    if (DEMO_MODE) {
      return;
    }

    // Persist to Firestore
    try {
      if (completed) {
        await setDoc(doc(db, 'completedTasks', taskId), {
          taskId,
          briefingDate: briefingDate || new Date().toISOString().split('T')[0],
          itemType,
          completedAt: serverTimestamp()
        });
      } else {
        await deleteDoc(doc(db, 'completedTasks', taskId));
      }
    } catch (error) {
      console.error('Error updating task completion:', error);
      // Revert optimistic update on error
      setCompletedTasks(prev => {
        const next = { ...prev };
        if (completed) {
          delete next[taskId]; // Revert: remove
        } else {
          next[taskId] = Date.now(); // Revert: add back
        }
        return next;
      });
    }
  }, []);

  const getCompletedCount = useCallback(() => {
    return Object.keys(completedTasks).length;
  }, [completedTasks]);

  return (
    <CompletedTasksContext.Provider value={{
      completedTasks,
      isCompleted,
      toggleTask,
      getCompletedCount,
      loading
    }}>
      {children}
    </CompletedTasksContext.Provider>
  );
}

export function useCompletedTasks() {
  const context = useContext(CompletedTasksContext);
  if (!context) {
    throw new Error('useCompletedTasks must be used within a CompletedTasksProvider');
  }
  return context;
}
