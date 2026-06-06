import { createBrowserRouter, RouterProvider } from 'react-router'
import { Layout } from './components/Layout'
import { Home } from './routes/Home'
import { GamePage } from './features/game/GamePage'
import { Settings } from './routes/Settings'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'game', element: <GamePage /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
