import { useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import SectionList from '../components/categorias/SectionList'
import SectionFormModal from '../components/categorias/SectionFormModal'
import CategoryFormModal from '../components/categorias/CategoryFormModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import useSectionsCategories from '../hooks/useSectionsCategories'

export default function Categorias() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const {
    sections,
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

  function handleSaveSection(data) {
    if (sectionModal.mode === 'edit') {
      updateSection(sectionModal.section.id, data)
    } else {
      addSection(data)
    }
    setSectionModal(null)
  }

  function handleSaveCategory(data) {
    if (categoryModal.mode === 'edit') {
      const { sectionId, ...rest } = data
      const originalSectionId = categoryModal.category.sectionId
      updateCategory(categoryModal.category.id, rest)
      if (sectionId !== originalSectionId) {
        moveCategoryToSection(categoryModal.category.id, sectionId, null)
      }
    } else {
      addCategory(data.sectionId, data)
    }
    setCategoryModal(null)
  }

  function confirmDeleteSection() {
    deleteSection(deleteSectionTarget.id)
    setDeleteSectionTarget(null)
  }

  function confirmDeleteCategory() {
    deleteCategory(deleteCategoryTarget.id)
    setDeleteCategoryTarget(null)
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Categorías
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Organiza tus secciones y categorías para usarlas en el Presupuesto
              </p>
            </div>

            <button
              onClick={() => setSectionModal({ mode: 'create' })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition"
            >
              <PlusIcon className="w-4 h-4" />
              Nueva sección
            </button>
          </div>

          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center gap-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl py-16">
              <p className="text-slate-500 dark:text-slate-400">Todavía no tienes secciones.</p>
              <button
                onClick={() => setSectionModal({ mode: 'create' })}
                className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline"
              >
                Crea la primera
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
          title="Eliminar sección"
          message={
            deleteSectionTarget.categories.length > 0
              ? `Esto eliminará también ${deleteSectionTarget.categories.length} categoría${
                  deleteSectionTarget.categories.length === 1 ? '' : 's'
                } dentro de "${deleteSectionTarget.name}". Esta acción no se puede deshacer.`
              : `¿Eliminar la sección "${deleteSectionTarget.name}"?`
          }
          confirmLabel="Eliminar"
          danger
          onConfirm={confirmDeleteSection}
          onCancel={() => setDeleteSectionTarget(null)}
        />
      )}

      {deleteCategoryTarget && (
        <ConfirmDialog
          title="Eliminar categoría"
          message={`¿Eliminar la categoría "${deleteCategoryTarget.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          danger
          onConfirm={confirmDeleteCategory}
          onCancel={() => setDeleteCategoryTarget(null)}
        />
      )}
    </div>
  )
}
