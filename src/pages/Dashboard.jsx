import { useState } from 'react'
import {
  CakeIcon,
  HomeModernIcon,
  FilmIcon,
  TruckIcon,
} from '@heroicons/react/24/outline'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import BudgetSummary from '../components/BudgetSummary'
import CategoriesOverview from '../components/CategoriesOverview'
import MovementsList from '../components/MovementsList'

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const categories = [
    {
      id: 1,
      name: 'Comida',
      icon: CakeIcon,
      budget: 5000,
      spent: 3250,
      color: '#10b981'
    },
    {
      id: 2,
      name: 'Hipoteca',
      icon: HomeModernIcon,
      budget: 8000,
      spent: 8000,
      color: '#f43f5e'
    },
    {
      id: 3,
      name: 'Entretenimiento',
      icon: FilmIcon,
      budget: 2000,
      spent: 450,
      color: '#0ea5e9'
    },
    {
      id: 4,
      name: 'Transporte',
      icon: TruckIcon,
      budget: 1500,
      spent: 600,
      color: '#6366f1'
    },
  ]

  const movements = [
    { id: 1, date: '2025-12-01', type: 'Ingreso', category: 'Salario', amount: 18000 },
    { id: 2, date: '2025-12-03', type: 'Gasto', category: 'Comida', amount: 2500 },
    { id: 3, date: '2025-12-05', type: 'Ahorro', category: 'Fondo Ahorro', amount: 5200 },
    { id: 4, date: '2025-12-06', type: 'Gasto', category: 'Entretenimiento', amount: 450 },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8">
          <BudgetSummary
            month="Diciembre 2025"
            income={25000}
            expenses={14350}
            savings={5200}
          />

          <CategoriesOverview categories={categories} />

          <MovementsList movements={movements} />
        </main>
      </div>
    </div>
  )
}
