import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router'
import Home from '@/features/dashboard/components/home'
import LoginPage from '@/features/authentication/components/login-page'
import Dashboard from '@/features/dashboard/components/dashboard'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
    </>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Dashboard,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
])

export const router = createRouter({ routeTree })
