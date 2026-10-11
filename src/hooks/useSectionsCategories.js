import { useEffect, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { getAll, saveAll, newSectionId, newCategoryId } from '../services/sectionsRepository'
import { DEFAULT_SECTION_ICON, DEFAULT_CATEGORY_ICON } from '../utils/heroicons'

function reindex(list) {
  return list.map((item, index) => ({ ...item, order: index }))
}

export default function useSectionsCategories() {
  const [sections, setSections] = useState(getAll)

  useEffect(() => {
    saveAll(sections)
  }, [sections])

  function findSectionOfCategory(categoryId) {
    return sections.find((s) => s.categories.some((c) => c.id === categoryId))
  }

  function addSection({ name, icon, color }) {
    setSections((prev) => [
      ...prev,
      {
        id: newSectionId(),
        name: name.trim(),
        icon: icon || DEFAULT_SECTION_ICON,
        color: color || '#64748b',
        order: prev.length,
        categories: [],
      },
    ])
  }

  function updateSection(sectionId, updates) {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, ...updates, name: (updates.name ?? s.name).trim() } : s))
    )
  }

  function deleteSection(sectionId) {
    setSections((prev) => reindex(prev.filter((s) => s.id !== sectionId)))
  }

  function addCategory(sectionId, { name, icon, color, plannedAmount = 0 }) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              categories: [
                ...s.categories,
                {
                  id: newCategoryId(),
                  sectionId,
                  name: name.trim(),
                  icon: icon || DEFAULT_CATEGORY_ICON,
                  color: color || '#6366f1',
                  plannedAmount: Math.max(0, Number(plannedAmount) || 0),
                  order: s.categories.length,
                },
              ],
            }
          : s
      )
    )
  }

  function updateCategory(categoryId, updates) {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        categories: s.categories.map((c) =>
          c.id === categoryId ? { ...c, ...updates, name: (updates.name ?? c.name).trim() } : c
        ),
      }))
    )
  }

  function deleteCategory(categoryId) {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        categories: reindex(s.categories.filter((c) => c.id !== categoryId)),
      }))
    )
  }

  function reorderSections(fromIndex, toIndex) {
    setSections((prev) => reindex(arrayMove(prev, fromIndex, toIndex)))
  }

  function reorderCategoriesInSection(sectionId, fromIndex, toIndex) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, categories: reindex(arrayMove(s.categories, fromIndex, toIndex)) } : s
      )
    )
  }

  function moveCategoryToSection(categoryId, targetSectionId, targetIndex) {
    setSections((prev) => {
      const sourceSection = prev.find((s) => s.categories.some((c) => c.id === categoryId))
      if (!sourceSection || sourceSection.id === targetSectionId) return prev

      const category = sourceSection.categories.find((c) => c.id === categoryId)
      if (!category) return prev

      return prev.map((s) => {
        if (s.id === sourceSection.id) {
          return { ...s, categories: reindex(s.categories.filter((c) => c.id !== categoryId)) }
        }
        if (s.id === targetSectionId) {
          const next = [...s.categories]
          const insertAt = targetIndex ?? next.length
          next.splice(insertAt, 0, { ...category, sectionId: targetSectionId })
          return { ...s, categories: reindex(next) }
        }
        return s
      })
    })
  }

  function isSectionNameTaken(name, excludeId) {
    const normalized = name.trim().toLowerCase()
    return sections.some((s) => s.id !== excludeId && s.name.trim().toLowerCase() === normalized)
  }

  function isCategoryNameTaken(sectionId, name, excludeId) {
    const normalized = name.trim().toLowerCase()
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return false
    return section.categories.some((c) => c.id !== excludeId && c.name.trim().toLowerCase() === normalized)
  }

  return {
    sections,
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
  }
}
