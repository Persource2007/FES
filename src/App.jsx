import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Organizations from './pages/Organizations'
import Users from './pages/Users'
import Activity from './pages/Activity'
import Stories from './pages/Stories'
import StoryReview from './pages/StoryReview'
import PublicStories from './pages/PublicStories'
import StoryDetail from './pages/StoryDetail'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stories" element={<PublicStories />} />
        <Route path="/stories/:slug" element={<StoryDetail />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/organizations"
          element={
            <ProtectedRoute>
              <Organizations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/activity"
          element={
            <ProtectedRoute>
              <Activity />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/stories"
          element={
            <ProtectedRoute>
              <Stories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/stories/review"
          element={
            <ProtectedRoute>
              <StoryReview />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App

