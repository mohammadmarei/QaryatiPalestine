import { lazy, type ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { RootRoute } from './RootRoute'
import { HomePage } from '@/features/home/HomePage'

/** Lazy-load a named export so each area ships as its own chunk. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function page<M extends Record<K, ComponentType<any>>, K extends keyof M>(loader: () => Promise<M>, name: K) {
  return lazy(async () => ({ default: (await loader())[name] }))
}

const VillagesExplorerPage = page(() => import('@/features/villages/VillagesExplorerPage'), 'VillagesExplorerPage')
const VillageDetailsPage = page(() => import('@/features/villages/VillageDetailsPage'), 'VillageDetailsPage')
const MapPage = page(() => import('@/features/map/MapPage'), 'MapPage')
const AboutPage = page(() => import('@/features/about/AboutPage'), 'AboutPage')

const LoginPage = page(() => import('@/features/auth/LoginPage'), 'LoginPage')
const RegisterPage = page(() => import('@/features/auth/RegisterPage'), 'RegisterPage')
const ForgotPasswordPage = page(() => import('@/features/auth/ForgotPasswordPage'), 'ForgotPasswordPage')

const DashboardOverviewPage = page(() => import('@/features/dashboard/DashboardOverviewPage'), 'DashboardOverviewPage')
const VillagesManagementPage = page(() => import('@/features/dashboard/VillagesManagementPage'), 'VillagesManagementPage')
const VillageFormPage = page(() => import('@/features/dashboard/village-form/VillageFormPage'), 'VillageFormPage')
const PopulationPage = page(() => import('@/features/population/PopulationPage'), 'PopulationPage')
const HeritagePage = page(() => import('@/features/heritage/HeritagePage'), 'HeritagePage')
const SourcesPage = page(() => import('@/features/sources/SourcesPage'), 'SourcesPage')
const ReviewsPage = page(() => import('@/features/reviews/ReviewsPage'), 'ReviewsPage')
const UsersPage = page(() => import('@/features/users/UsersPage'), 'UsersPage')
const AuditLogsPage = page(() => import('@/features/audit-logs/AuditLogsPage'), 'AuditLogsPage')
const ProfilePage = page(() => import('@/features/profile/ProfilePage'), 'ProfilePage')
const SettingsPage = page(() => import('@/features/settings/SettingsPage'), 'SettingsPage')
const NotFoundPage = page(() => import('@/features/errors/NotFoundPage'), 'NotFoundPage')

export const router = createBrowserRouter([
  {
    element: <RootRoute />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/villages', element: <VillagesExplorerPage /> },
          { path: '/villages/:id', element: <VillageDetailsPage /> },
          { path: '/map', element: <MapPage /> },
          { path: '/about', element: <AboutPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
        ],
      },
      {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardOverviewPage /> },
          { path: 'villages', element: <VillagesManagementPage /> },
          { path: 'villages/new', element: <VillageFormPage mode="create" /> },
          { path: 'villages/:id/edit', element: <VillageFormPage mode="edit" /> },
          { path: 'population', element: <PopulationPage /> },
          { path: 'heritage', element: <HeritagePage /> },
          { path: 'sources', element: <SourcesPage /> },
          { path: 'reviews', element: <ReviewsPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'audit-logs', element: <AuditLogsPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
])
