import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Categorias from './pages/Categorias'
import Budget from './pages/Budget'
import { ThemeProvider } from './context/ThemeContext'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/budget" element={<Budget />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
