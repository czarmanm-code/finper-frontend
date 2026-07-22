import CategoryCard from './CategoryCard'

export default function CategoriesOverview({ categories }) {
  return (
    <section className="bg-slate-100 dark:bg-slate-900/50 border border-transparent dark:border-slate-800 rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
        Categorías del mes
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} {...cat} />
        ))}
      </div>
    </section>
  )
}
