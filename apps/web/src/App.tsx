import { createBrowserRouter, RouterProvider } from 'react-router'
import { Layout } from './components/Layout'
import { Home } from './routes/Home'
import { Game } from './routes/Game'
import { Settings } from './routes/Settings'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'game', element: <Game /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
