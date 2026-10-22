import { useState, useMemo } from 'react'
import { PlusIcon, TagIcon } from '@heroicons/react/24/outline'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import SectionList from '../components/categorias/SectionList'
import SectionFormModal from '../components/categorias/SectionFormModal'
import CategoryFormModal from '../components/categorias/CategoryFormModal'
import CategoryDetailSheet from '../components/CategoryDetailSheet'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import useSectionsCategories from '../hooks/useSectionsCategories'
import { getTransactions, deleteTransaction } from '../services/transactionsService'
import { useDateFilter } from '../context/DateContext'

export default function Categorias() {
  const { monthLabel, isTransactionInSelectedMonth } = useDateFilter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedSectionForDetail, setSelectedSectionForDetail] = useState(null)
  const [transactions, setTransactions] = useState([])
  const {
    sections,
    loading,
    addSection,
    updateSection,
    deleteSection,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderSections,
    reorderCategoriesInSection,
    moveCategoryToSection,
    isSectionNameTaken,
    isCategoryNameTaken,
  } = useSectionsCategories()

  const [sectionModal, setSectionModal] = useState(null) // { mode: 'create' | 'edit', section? }
  const [categoryModal, setCategoryModal] = useState(null) // { mode: 'create' | 'edit', sectionId?, category? }
  const [deleteSectionTarget, setDeleteSectionTarget] = useState(null)
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null)

  const totalCategories = useMemo(() => {
    return sections.reduce((sum, s) => sum + (s.categories?.length || 0), 0)
  }, [sections])

  async function handleSaveSection(data) {
    if (sectionModal.mode === 'edit') {
      await updateSection(sectionModal.section.id, data)
    } else {
      await addSection(data)
    }
    setSectionModal(null)
  }

  async function handleSaveCategory(data) {
    if (categoryModal.mode === 'edit') {
      const { sectionId, ...rest } = data
      const originalSectionId = categoryModal.category.sectionId
      await updateCategory(categoryModal.category.id, rest)
      if (sectionId !== originalSectionId) {
        await moveCategoryToSection(categoryModal.category.id, sectionId, null)
      }
    } else {
      await addCategory(data.sectionId, data)
    }
    setCategoryModal(null)
  }

  async function handleInspectSection(section) {
    setSelectedSectionForDetail(section)
    try {
      const txs = await getTransactions()
      setTransactions(txs)
    } catch (err) {
      console.error('Error fetching transactions for section:', err)
    }
  }

  async function confirmDeleteSection() {
    await deleteSection(deleteSectionTarget.id)
    setDeleteSectionTarget(null)
  }

  async function confirmDeleteCategory() {
    await deleteCategory(deleteCategoryTarget.id)
    setDeleteCategoryTarget(null)
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Categories & Sections
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                  {sections.length} Sections · {totalCategories} Categories
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Organize your financial groups, icons, colors, and spending limits
              </p>
            </div>

            <button
              onClick={() => setSectionModal({ mode: 'create' })}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition"
            >
              <PlusIcon className="w-4 h-4" />
              <span>New Section</span>
            </button>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
              <p className="text-sm text-slate-400">Loading categories...</p>
            </div>
          ) : sections.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-4">
                <TagIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                No Sections Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                Start structuring your personal finances by creating your first section (like Income, Fixed Expenses, or Savings).
              </p>
              <button
                onClick={() => setSectionModal({ mode: 'create' })}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Create First Section</span>
              </button>
            </div>
          ) : (
            <SectionList
              sections={sections}
              reorderSections={reorderSections}
              reorderCategoriesInSection={reorderCategoriesInSection}
              moveCategoryToSection={moveCategoryToSection}
              onEditSection={(section) => setSectionModal({ mode: 'edit', section })}
              onDeleteSection={(section) => setDeleteSectionTarget(section)}
              onAddCategory={(sectionId) => setCategoryModal({ mode: 'create', sectionId })}
              onEditCategory={(category) => setCategoryModal({ mode: 'edit', category })}
              onDeleteCategory={(category) => setDeleteCategoryTarget(category)}
              onInspectSection={handleInspectSection}
            />
          )}
        </main>
      </div>

      {sectionModal && (
        <SectionFormModal
          section={sectionModal.section}
          isNameTaken={isSectionNameTaken}
          onSave={handleSaveSection}
          onClose={() => setSectionModal(null)}
        />
      )}

      {categoryModal && (
        <CategoryFormModal
          category={categoryModal.category}
          sections={sections}
          defaultSectionId={categoryModal.sectionId}
          isNameTaken={isCategoryNameTaken}
          onSave={handleSaveCategory}
          onClose={() => setCategoryModal(null)}
        />
      )}

      {deleteSectionTarget && (
        <ConfirmDialog
          title="Delete Section"
          message={
            (deleteSectionTarget.categories?.length || 0) > 0
              ? `This will also delete ${deleteSectionTarget.categories.length} categor${
                  deleteSectionTarget.categories.length === 1 ? 'y' : 'ies'
                } inside "${deleteSectionTarget.name}". This action cannot be undone.`
              : `Delete section "${deleteSectionTarget.name}"?`
          }
          confirmLabel="Delete"
          danger
          onConfirm={confirmDeleteSection}
          onCancel={() => setDeleteSectionTarget(null)}
        />
      )}

      {deleteCategoryTarget && (
        <ConfirmDialog
          title="Delete Category"
          message={`Delete category "${deleteCategoryTarget.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDeleteCategory}
          onCancel={() => setDeleteCategoryTarget(null)}
        />
      )}

      {/* Section Drill-down Detail Sheet */}
      <CategoryDetailSheet
        isOpen={Boolean(selectedSectionForDetail)}
        onClose={() => setSelectedSectionForDetail(null)}
        item={selectedSectionForDetail}
        type="section"
        monthLabel={monthLabel}
        transactions={transactions.filter((tx) => isTransactionInSelectedMonth(tx.date))}
        onDeleteTransaction={async (tx) => {
          await deleteTransaction(tx.id || tx.serverId)
          const updated = await getTransactions()
          setTransactions(updated)
        }}
      />
    </div>
  )
}
