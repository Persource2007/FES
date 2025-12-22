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
import LeafletMapPage from './pages/LeafletMapPage'
import OAuth from './pages/OAuth'
import OAuthCallback from './pages/OAuthCallback'
import DashboardAPI from './pages/DashboardAPI'
import UserForm from './pages/UserForm'
import OrganizationForm from './pages/OrganizationForm'
import StoryForm from './pages/StoryForm'
import CategoryForm from './pages/CategoryForm'
import Categories from './pages/Categories'
import ProtectedRoute from './components/ProtectedRoute'
import { useTokenRefresh } from './hooks/useTokenRefresh'

function App() {
  // Enable proactive token refresh globally
  useTokenRefresh(true)

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stories" element={<PublicStories />} />
        <Route path="/stories/:slug" element={<StoryDetail />} />
        <Route path="/leaflet-map" element={<LeafletMapPage />} />
        <Route path="/oauth" element={<OAuth />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
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
          path="/dashboard/organizations/new"
          element={
            <ProtectedRoute>
              <OrganizationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/organizations/:id/edit"
          element={
            <ProtectedRoute>
              <OrganizationForm />
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
          path="/dashboard/users/new"
          element={
            <ProtectedRoute>
              <UserForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/users/:id/edit"
          element={
            <ProtectedRoute>
              <UserForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/categories"
          element={
            <ProtectedRoute>
              <Categories />
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
          path="/dashboard/stories/new"
          element={
            <ProtectedRoute>
              <StoryForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/stories/:id/edit"
          element={
            <ProtectedRoute>
              <StoryForm />
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
        <Route
          path="/dashboard/categories/new"
          element={
            <ProtectedRoute>
              <CategoryForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/categories/:id/edit"
          element={
            <ProtectedRoute>
              <CategoryForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/api"
          element={
            <ProtectedRoute>
              <DashboardAPI />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App

