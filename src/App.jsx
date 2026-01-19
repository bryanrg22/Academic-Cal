import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { Submit } from './pages/Submit';
import { ToastProvider } from './components/Toast';
import { CompletedTasksProvider } from './hooks/useCompletedTasks';

function App() {
  return (
    <CompletedTasksProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/history/:date" element={<History />} />
            <Route path="/submit" element={<Submit />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </CompletedTasksProvider>
  );
}

export default App;
