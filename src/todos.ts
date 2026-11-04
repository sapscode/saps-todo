export const categories = ['Work', 'Personal', 'Learning'] as const
export const priorities = ['High', 'Medium', 'Low'] as const
export type Category = typeof categories[number]
export type Priority = typeof priorities[number]
export type View = 'All tasks' | 'Today' | 'Upcoming' | 'Completed'
export interface Todo {
  id: string
  title: string
  notes: string
  category: Category
  priority: Priority
  due: string
  completed: boolean
  createdAt: number
}
export const storageKey = 'little-todos-v1'

export function dateKey(date = new Date()): string {
  return `${date.getFullYear().toString().padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function validDate(value: string) {
  if (value === '') return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false
  const parsed = new Date(`${value}T12:00:00`)
  return !Number.isNaN(parsed.getTime()) && dateKey(parsed) === value
}

export function starterTodos(): Todo[] {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return [
    { id: 'welcome-1', title: 'Plan a little, achieve a lot', notes: 'Pick your top priorities for the day.', category: 'Personal', priority: 'High', due: dateKey(), completed: false, createdAt: 6 },
    { id: 'welcome-2', title: 'Explore Azure Static Web Apps', notes: 'Your first step toward taking this app to the cloud.', category: 'Learning', priority: 'High', due: dateKey(), completed: false, createdAt: 5 },
    { id: 'welcome-3', title: 'Make time for a screen-free break', notes: 'A short walk and a fresh perspective.', category: 'Personal', priority: 'Low', due: dateKey(), completed: false, createdAt: 4 },
    { id: 'welcome-4', title: 'Sketch out the next big idea', notes: '', category: 'Work', priority: 'Medium', due: dateKey(tomorrow), completed: false, createdAt: 3 },
    { id: 'welcome-5', title: 'Learn how React state works', notes: 'Small concepts, endless possibilities.', category: 'Learning', priority: 'Medium', due: '', completed: true, createdAt: 2 },
    { id: 'welcome-6', title: 'Create a space to stay organized', notes: '', category: 'Personal', priority: 'Low', due: '', completed: true, createdAt: 1 },
  ]
}

export function loadTodos(raw: string | null): Todo[] {
  if (raw === null) return starterTodos()
  const value: unknown = JSON.parse(raw)
  if (!Array.isArray(value)) throw new Error('Saved tasks are not a valid list.')
  const ids = new Set<string>()
  for (const item of value) {
    if (typeof item !== 'object' || item === null ||
      typeof item.id !== 'string' || !item.id || ids.has(item.id) ||
      typeof item.title !== 'string' || !item.title.trim() || item.title.length > 160 ||
      typeof item.notes !== 'string' || item.notes.length > 1000 ||
      !categories.includes(item.category) || !priorities.includes(item.priority) ||
      typeof item.due !== 'string' || !validDate(item.due) ||
      typeof item.completed !== 'boolean' || typeof item.createdAt !== 'number' || !Number.isFinite(item.createdAt)) {
      throw new Error('Saved tasks contain invalid data.')
    }
    ids.add(item.id)
  }
  return value
}

interface Filters {
  view: View
  category: Category | 'All'
  query: string
  status: string
  sort: string
  today: string
}

export function filterTodos(todos: Todo[], filters: Filters): Todo[] {
  const { view, category, query, status, sort, today } = filters
  const search = query.trim().toLowerCase()
  return todos.filter((todo) =>
    (category === 'All' || todo.category === category) &&
    (status === 'All' || (status === 'Done' ? todo.completed : !todo.completed)) &&
    (view === 'All tasks' || (view === 'Completed' ? todo.completed : !todo.completed && (view === 'Today' ? todo.due === today : todo.due > today))) &&
    `${todo.title} ${todo.notes}`.toLowerCase().includes(search),
  ).sort((a, b) => {
    if (sort === 'priority') return priorities.indexOf(a.priority) - priorities.indexOf(b.priority) || b.createdAt - a.createdAt
    if (sort === 'due') return (a.due || '9999-12-31').localeCompare(b.due || '9999-12-31') || b.createdAt - a.createdAt
    return b.createdAt - a.createdAt
  })
}
