import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SectionCard from './SectionCard'
import CategoryChip from './CategoryChip'

function findSectionIdFromOverId(overId, sections) {
  if (typeof overId === 'string' && overId.startsWith('categories-')) {
    return overId.replace('categories-', '')
  }
  const ownerSection = sections.find((s) => s.categories.some((c) => c.id === overId))
  if (ownerSection) return ownerSection.id
  if (sections.some((s) => s.id === overId)) return overId
  return null
}

export default function SectionList({
  sections,
  reorderSections,
  reorderCategoriesInSection,
  moveCategoryToSection,
  onEditSection,
  onDeleteSection,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}) {
  const [activeItem, setActiveItem] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  const sectionIds = sections.map((s) => s.id)

  function handleDragStart(event) {
    const { active } = event
    const type = active.data.current?.type
    if (type === 'section') {
      const section = sections.find((s) => s.id === active.id)
      setActiveItem({ type, data: section })
    } else if (type === 'category') {
      const section = sections.find((s) => s.categories.some((c) => c.id === active.id))
      const category = section?.categories.find((c) => c.id === active.id)
      setActiveItem({ type, data: category })
    }
  }

  function handleDragOver(event) {
    const { active, over } = event
    if (!over) return
    if (active.data.current?.type !== 'category') return

    const sourceSection = sections.find((s) => s.categories.some((c) => c.id === active.id))
    const targetSectionId = findSectionIdFromOverId(over.id, sections)
    if (!sourceSection || !targetSectionId || sourceSection.id === targetSectionId) return

    const targetSection = sections.find((s) => s.id === targetSectionId)
    const overIndex = targetSection.categories.findIndex((c) => c.id === over.id)
    const targetIndex = overIndex >= 0 ? overIndex : targetSection.categories.length

    moveCategoryToSection(active.id, targetSectionId, targetIndex)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveItem(null)
    if (!over) return

    const type = active.data.current?.type

    if (type === 'section') {
      const targetSectionId = findSectionIdFromOverId(over.id, sections)
      if (!targetSectionId || active.id === targetSectionId) return
      const oldIndex = sections.findIndex((s) => s.id === active.id)
      const newIndex = sections.findIndex((s) => s.id === targetSectionId)
      if (oldIndex >= 0 && newIndex >= 0) reorderSections(oldIndex, newIndex)
      return
    }

    if (type === 'category') {
      const sourceSection = sections.find((s) => s.categories.some((c) => c.id === active.id))
      const targetSectionId = findSectionIdFromOverId(over.id, sections) ?? sourceSection?.id
      if (!sourceSection || sourceSection.id !== targetSectionId) return

      const oldIndex = sourceSection.categories.findIndex((c) => c.id === active.id)
      const overIndex = sourceSection.categories.findIndex((c) => c.id === over.id)
      const newIndex = overIndex >= 0 ? overIndex : sourceSection.categories.length - 1

      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        reorderCategoriesInSection(sourceSection.id, oldIndex, newIndex)
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-4">
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              onEditSection={onEditSection}
              onDeleteSection={onDeleteSection}
              onAddCategory={onAddCategory}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem?.type === 'category' && activeItem.data && (
          <div className="shadow-lg rounded-lg">
            <CategoryChip category={activeItem.data} onEdit={() => {}} onDelete={() => {}} dragOverlay />
          </div>
        )}
        {activeItem?.type === 'section' && activeItem.data && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-5 opacity-95">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
              {activeItem.data.name}
            </p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
