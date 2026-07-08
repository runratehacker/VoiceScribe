import React from 'react'
import VoiceAssistantUI from './Frontpage'
import Login from './components/Login'
import FormList from './components/FormList'
import TeacherDashboard from './components/TeacherDashboard'
import { Route, Routes, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element={<Login />} />
        <Route 
          path='/fillform' 
          element={
            <ProtectedRoute>
              <FormList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path='/teacher-dashboard' 
          element={
            <ProtectedRoute>
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path='/fillform/:formid' 
          element={
            <ProtectedRoute>
              <VoiceAssistantUI />
            </ProtectedRoute>
          } 
        />
      </Routes>

    </div>
  )
}

export default App
