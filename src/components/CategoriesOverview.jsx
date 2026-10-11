import CategoryCard from './CategoryCard'

export default function CategoriesOverview({ categories, onSetTarget }) {
  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Category Breakdown
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active spending limits and expected income tracking
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} {...cat} onSetTarget={onSetTarget} />
        ))}
      </div>
    </section>
  )
}
