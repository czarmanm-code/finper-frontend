import { useEffect, useState, useCallback } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import {
  getSections,
  createSection as apiCreateSection,
  updateSection as apiUpdateSection,
  deleteSection as apiDeleteSection,
  reorderSections as apiReorderSections,
  createCategory as apiCreateCategory,
  updateCategory as apiUpdateCategory,
  deleteCategory as apiDeleteCategory,
  reorderCategories as apiReorderCategories,
} from '../services/categoriesService'
import { DEFAULT_SECTION_ICON, DEFAULT_CATEGORY_ICON } from '../utils/heroicons'

function reindex(list) {
  return list.map((item, index) => ({ ...item, order: index }))
}

export default function useSectionsCategories() {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const serverSections = await getSections()
      setSections(serverSections)
    } catch (err) {
      console.error('[useSectionsCategories] Error loading sections:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function findSectionOfCategory(categoryId) {
    return sections.find((s) => s.categories?.some((c) => (c.id || c._id) === categoryId))
  }

  async function addSection({ name, icon, color }) {
    try {
      const newSec = await apiCreateSection({
        name: name.trim(),
        icon: icon || DEFAULT_SECTION_ICON,
        color: color || '#64748b',
      })
      setSections((prev) => [...prev, { ...newSec, categories: [] }])
    } catch (err) {
      console.error('Error adding section:', err)
      await loadData()
    }
  }

  async function updateSection(sectionId, updates) {
    try {
      await apiUpdateSection(sectionId, updates)
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, ...updates, name: (updates.name ?? s.name).trim() } : s))
      )
    } catch (err) {
      console.error('Error updating section:', err)
      await loadData()
    }
  }

  async function deleteSection(sectionId) {
    try {
      await apiDeleteSection(sectionId)
      setSections((prev) => reindex(prev.filter((s) => s.id !== sectionId)))
    } catch (err) {
      console.error('Error deleting section:', err)
      await loadData()
    }
  }

  async function addCategory(sectionId, { name, icon, color }) {
    try {
      const targetSec = sections.find((s) => s.id === sectionId)
      const secName = targetSec?.name?.toLowerCase() || ''
      const type =
        secName.includes('income') || secName.includes('salary') || secName.includes('ingreso')
          ? 'income'
          : 'expense'

      const newCat = await apiCreateCategory({
        name: name.trim(),
        sectionId,
        type,
        icon: icon || DEFAULT_CATEGORY_ICON,
        color: color || '#6366f1',
        plannedAmount: 0,
      })

      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                categories: [
                  ...(s.categories || []),
                  {
                    id: newCat.id || newCat._id,
                    sectionId,
                    name: newCat.name,
                    icon: newCat.icon,
                    color: newCat.color,
                    type: newCat.type,
                    plannedAmount: 0,
                    order: (s.categories || []).length,
                  },
                ],
              }
            : s
        )
      )
    } catch (err) {
      console.error('Error adding category:', err)
      await loadData()
    }
  }

  async function updateCategory(categoryId, updates) {
    try {
      await apiUpdateCategory(categoryId, updates)
      setSections((prev) =>
        prev.map((s) => ({
          ...s,
          categories: (s.categories || []).map((c) =>
            (c.id || c._id) === categoryId ? { ...c, ...updates, name: (updates.name ?? c.name).trim() } : c
          ),
        }))
      )
    } catch (err) {
      console.error('Error updating category:', err)
      await loadData()
    }
  }

  async function deleteCategory(categoryId) {
    try {
      await apiDeleteCategory(categoryId)
      setSections((prev) =>
        prev.map((s) => ({
          ...s,
          categories: reindex((s.categories || []).filter((c) => (c.id || c._id) !== categoryId)),
        }))
      )
    } catch (err) {
      console.error('Error deleting category:', err)
      await loadData()
    }
  }

  async function reorderSections(fromIndex, toIndex) {
    const reordered = reindex(arrayMove(sections, fromIndex, toIndex))
    setSections(reordered)
    try {
      await apiReorderSections(reordered.map((s) => s.id))
    } catch (err) {
      console.error('Error reordering sections:', err)
      await loadData()
    }
  }

  async function reorderCategoriesInSection(sectionId, fromIndex, toIndex) {
    const targetSec = sections.find((s) => s.id === sectionId)
    if (!targetSec || !targetSec.categories) return

    const reorderedCats = reindex(arrayMove(targetSec.categories, fromIndex, toIndex))
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, categories: reorderedCats } : s))
    )

    try {
      await apiReorderCategories(reorderedCats.map((c) => c.id || c._id))
    } catch (err) {
      console.error('Error reordering categories:', err)
      await loadData()
    }
  }

  async function moveCategoryToSection(categoryId, targetSectionId, targetIndex) {
    const sourceSection = sections.find((s) => s.categories?.some((c) => (c.id || c._id) === categoryId))
    if (!sourceSection || sourceSection.id === targetSectionId) return

    const category = sourceSection.categories?.find((c) => (c.id || c._id) === categoryId)
    if (!category) return

    setSections((prev) =>
      prev.map((s) => {
        if (s.id === sourceSection.id) {
          return { ...s, categories: reindex(s.categories.filter((c) => (c.id || c._id) !== categoryId)) }
        }
        if (s.id === targetSectionId) {
          const next = [...(s.categories || [])]
          const insertAt = targetIndex ?? next.length
          next.splice(insertAt, 0, { ...category, sectionId: targetSectionId })
          return { ...s, categories: reindex(next) }
        }
        return s
      })
    )

    try {
      await apiUpdateCategory(categoryId, { sectionId: targetSectionId })
    } catch (err) {
      console.error('Error moving category to section:', err)
      await loadData()
    }
  }

  function isSectionNameTaken(name, excludeId) {
    const normalized = name.trim().toLowerCase()
    return sections.some((s) => s.id !== excludeId && s.name.trim().toLowerCase() === normalized)
  }

  function isCategoryNameTaken(sectionId, name, excludeId) {
    const normalized = name.trim().toLowerCase()
    const section = sections.find((s) => s.id === sectionId)
    if (!section || !section.categories) return false
    return section.categories.some(
      (c) => (c.id || c._id) !== excludeId && c.name.trim().toLowerCase() === normalized
    )
  }

  return {
    sections,
    loading,
    findSectionOfCategory,
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
    refreshSections: loadData,
  }
}
