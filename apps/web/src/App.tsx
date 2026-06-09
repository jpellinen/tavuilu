import { createBrowserRouter, RouterProvider } from 'react-router'
import { Layout } from './components/Layout'
import { Home } from './routes/Home'
import { GamePage } from './features/syllable-game/GamePage'
import { Settings } from './routes/Settings'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'game', element: <GamePage /> },
      { path: 'settings', element: <Settings /> },
      { path: 'auth/login', element: <LoginPage /> },
      { path: 'auth/register', element: <RegisterPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
