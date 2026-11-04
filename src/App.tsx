import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { categories, dateKey, filterTodos, loadTodos, priorities, storageKey } from './todos'
import type { Category, Priority, Todo, View } from './todos'
import './App.css'

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 11h18m-13 5h3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    circle: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    cloud: <path d="M6 18a5 5 0 0 1-1-10 7 7 0 0 1 13-1 5.5 5.5 0 0 1 0 11H6Z" />,
    edit: <><path d="m14 5 5 5M4 20l5-1L20 8a2 2 0 0 0-5-5L4 14v6Z" /></>,
    trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    flag: <><path d="M5 21V3c5-4 9 4 14 0v11c-5 4-9-4-14 0" /></>,
    leaf: <><path d="M20 3C6 2 2 9 6 16s16 2 14-13ZM5 21 15 9" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.circle}</svg>
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { ref.current?.showModal() }, [])
  return <dialog ref={ref} onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose() }} aria-labelledby="modal-title">
    <div className="modal-heading"><h2 id="modal-title">{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><Icon name="close" /></button></div>
    {children}
  </dialog>
}

function TaskForm({ task, onSave, onClose }: { task?: Todo; onSave: (todo: Todo) => void; onClose: () => void }) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [category, setCategory] = useState<Category>(task?.category ?? 'Personal')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'Medium')
  const [due, setDue] = useState(task?.due ?? '')
  function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return
    onSave({ id: task?.id ?? crypto.randomUUID(), title: title.trim(), notes: notes.trim(), category, priority, due, completed: task?.completed ?? false, createdAt: task?.createdAt ?? Date.now() })
    onClose()
  }
  return <Modal title={task ? 'Edit task' : 'A little step forward'} onClose={onClose}>
    <p className="modal-description">Make room for what matters. One task at a time.</p>
    <form onSubmit={submit}>
      <label>Task name<input autoFocus required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What would you like to get done?" /></label>
      <label>Notes <span className="muted">(optional)</span><textarea maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add a few details..." rows={3} /></label>
      <div className="form-grid">
        <label>List<select value={category} onChange={(e) => setCategory(e.target.value as Category)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Priority<select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <label>Due date <span className="muted">(optional)</span><input type="date" min="0001-01-01" max="9999-12-31" value={due} onChange={(e) => setDue(e.target.value)} /></label>
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={!title.trim()}>{task ? 'Save changes' : 'Create task'}<Icon name="arrow" size={17} /></button></div>
    </form>
  </Modal>
}

function App() {
  const [initial] = useState(() => {
    try { return { todos: loadTodos(localStorage.getItem(storageKey)), error: '' } }
    catch (error) { return { todos: [] as Todo[], error: `${error instanceof Error ? error.message : 'Unable to load tasks.'} Stored data has not been changed. Reload after resolving the issue.` } }
  })
  const [todos, setTodos] = useState(initial.todos)
  const [error, setError] = useState(initial.error)
  const [view, setView] = useState<View>('All tasks')
  const [category, setCategory] = useState<Category | 'All'>('All')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [sort, setSort] = useState('created')
  const [editor, setEditor] = useState<Todo | 'new' | null>(null)
  const [showAzure, setShowAzure] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])
  const today = dateKey(now)
  const completed = todos.filter((todo) => todo.completed).length
  const percent = todos.length ? Math.round(completed / todos.length * 100) : 0
  const visible = filterTodos(todos, { view, category, query, status, sort, today })
  const views: { name: View; icon: string; count: number }[] = [
    { name: 'All tasks', icon: 'grid', count: todos.length },
    { name: 'Today', icon: 'sun', count: todos.filter((t) => t.due === today && !t.completed).length },
    { name: 'Upcoming', icon: 'calendar', count: todos.filter((t) => t.due > today && !t.completed).length },
    { name: 'Completed', icon: 'circle', count: completed },
  ]
  function update(next: Todo[], message: string) {
    if (initial.error) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
      setTodos(next)
      setError('')
      setAnnouncement(message)
    } catch { setError('Your changes could not be saved. Browser storage may be full or disabled. Free up storage and try again. Your task list has not been changed.') }
  }
  function save(todo: Todo) {
    update(todos.some((t) => t.id === todo.id) ? todos.map((t) => t.id === todo.id ? todo : t) : [todo, ...todos], 'Task saved.')
  }
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setView('All tasks'); setCategory('All') }}><span className="brand-mark"><Icon name="check" size={25} /></span>little<span className="brand-dot">.</span></a>
      <div className="workspace-label">YOUR EVERYDAY, ORGANIZED</div>
      <nav aria-label="Task views">{views.map((item) => <button key={item.name} className={`nav-item ${view === item.name ? 'active' : ''}`} onClick={() => { setView(item.name); setStatus('All') }}><Icon name={item.icon} /><span>{item.name}</span><span className="nav-count">{item.count}</span></button>)}</nav>
      <div className="list-heading">MY LISTS <span>3</span></div>
      <nav aria-label="Task lists">{categories.map((item) => <button key={item} className={`list-item ${category === item ? 'selected' : ''}`} aria-pressed={category === item} onClick={() => setCategory(category === item ? 'All' : item)}><span className={`category-dot ${item.toLowerCase()}`} /><span>{item}</span><span className="list-count">{todos.filter((t) => t.category === item && !t.completed).length}</span></button>)}</nav>
      <div className="sidebar-bottom">
        <div className="azure-card"><span className="azure-symbol"><Icon name="cloud" /></span><h3>Small app. Big possibilities.</h3><p>Your next cloud project starts with a little todo.</p><button onClick={() => setShowAzure(true)}>Explore Azure deployment <Icon name="arrow" size={16} /></button></div>
        <div className="profile"><span className="avatar">Y</span><div><strong>Your workspace</strong><small>Personal space</small></div><span className="profile-dot" title="Local workspace" /></div>
      </div>
    </aside>
    <main>
      <header className="topbar"><div className="breadcrumb">My workspace <span>/</span><strong>{view}</strong></div><div className="local-badge"><span /> Saved on this device</div></header>
      <div className="main-content">
        <div className="page-heading"><div><div className="eyebrow"><Icon name="sun" size={16} /> A LITTLE FOCUS GOES A LONG WAY</div><h1>{view === 'All tasks' ? 'Make space for progress.' : view === 'Today' ? 'A fresh start, today.' : view === 'Upcoming' ? 'Good things ahead.' : 'Look how far you’ve come.'}</h1><p>Your ideas, plans, and everyday wins. All in one little place.</p></div><button className="primary-button new-task" disabled={!!initial.error} onClick={() => setEditor('new')}><Icon name="plus" size={19} /> New task</button></div>
        {error && <div className="error-banner" role="alert">{error}</div>}
        <section className="overview" aria-label="Task overview">
          <div className="stat"><span className="stat-icon mint"><Icon name="grid" /></span><div><span>Total tasks</span><strong>{todos.length}<small>A little of everything</small></strong></div></div>
          <div className="stat"><span className="stat-icon amber"><Icon name="sun" /></span><div><span>In progress</span><strong>{todos.length - completed}<small>One step at a time</small></strong></div></div>
          <div className="stat"><span className="stat-icon lavender"><Icon name="circle" /></span><div><span>Completed</span><strong>{completed}<small>Look at you go!</small></strong></div></div>
        </section>
        <section className="progress-banner"><div className="progress-illustration"><Icon name="leaf" size={30} /></div><div className="progress-copy"><h2>{percent === 100 ? 'You did it. Enjoy a little breathing room.' : 'Little steps. Real progress.'}</h2><p>{completed ? `You’ve completed ${completed} of ${todos.length} tasks. Keep your momentum going.` : 'Every great day starts with one small step. You’ve got this.'}</p></div><div className="progress-track-wrap"><div><span>Your progress</span><strong>{percent}%</strong></div><progress value={completed} max={todos.length || 1} aria-label="Task completion" /></div></section>
        <section className="tasks-section" aria-labelledby="tasks-heading">
          <div className="section-heading"><h2 id="tasks-heading">{category === 'All' ? view : category} <span>{visible.length}</span></h2><span className="today-label">{now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>
          <div className="toolbar"><div className="tabs" aria-label="Filter by status">{['All', 'Active', 'Done'].map((item) => <button key={item} className={status === item ? 'tab active' : 'tab'} aria-pressed={status === item} onClick={() => setStatus(item)}>{item}</button>)}</div><select className="mobile-list-filter" aria-label="Filter by list" value={category} onChange={(e) => setCategory(e.target.value as Category | 'All')}><option value="All">All lists</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><div className="toolbar-right"><label className="search"><Icon name="search" size={17} /><input aria-label="Search tasks" placeholder="Search tasks..." value={query} onChange={(e) => setQuery(e.target.value)} /></label><select aria-label="Sort tasks" value={sort} onChange={(e) => setSort(e.target.value)}><option value="created">Newest first</option><option value="due">Due date</option><option value="priority">Priority</option></select></div></div>
          <div className="task-list">
            {visible.map((todo) => <article key={todo.id} className={`task-row ${todo.completed ? 'is-completed' : ''}`}>
              <input type="checkbox" className="task-checkbox" checked={todo.completed} aria-label={`Complete ${todo.title}`} disabled={!!initial.error} onChange={() => update(todos.map((t) => t.id === todo.id ? { ...t, completed: !t.completed } : t), todo.completed ? 'Task reopened.' : 'Task completed. Nice work!')} />
              <div className="task-content"><button className="task-title" onClick={() => setEditor(todo)} disabled={!!initial.error}>{todo.title}</button>{todo.notes && <p>{todo.notes}</p>}<div className="task-meta"><span><span className={`category-dot ${todo.category.toLowerCase()}`} />{todo.category}</span>{todo.due && <span className={!todo.completed && todo.due < today ? 'overdue' : todo.due === today ? 'due-today' : ''}><Icon name="calendar" size={13} />{todo.due === today ? 'Today' : new Date(`${todo.due}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: todo.due.slice(0, 4) !== today.slice(0, 4) ? 'numeric' : undefined })}{!todo.completed && todo.due < today ? ' · Overdue' : ''}</span>}</div></div>
              <span className={`priority ${todo.priority.toLowerCase()}`}><Icon name="flag" size={12} />{todo.priority}</span>
              <div className="task-actions"><button className="icon-button" aria-label={`Edit ${todo.title}`} disabled={!!initial.error} onClick={() => setEditor(todo)}><Icon name="edit" size={17} /></button><button className="icon-button delete-button" aria-label={`Delete ${todo.title}`} disabled={!!initial.error} onClick={() => update(todos.filter((t) => t.id !== todo.id), 'Task deleted.')}><Icon name="trash" size={17} /></button></div>
            </article>)}
            {!visible.length && <div className="empty-state"><span className="empty-icon"><Icon name={query ? 'search' : 'leaf'} size={30} /></span><h3>{query ? 'No matching little tasks.' : 'A little breathing room.'}</h3><p>{query || category !== 'All' || status !== 'All' ? 'Try another search or filter, or add something new.' : 'Nothing here yet. Add a task and take your first step.'}</p><button className="secondary-button" disabled={!!initial.error} onClick={() => setEditor('new')}><Icon name="plus" size={16} /> Add a task</button></div>}
            <button className="add-task-row" disabled={!!initial.error} onClick={() => setEditor('new')}><Icon name="plus" size={18} /> Add a little task...</button>
          </div>
          <div className="list-footer"><span>{todos.length - completed} tasks left to make things happen</span>{completed > 0 && <button disabled={!!initial.error} onClick={() => update(todos.filter((t) => !t.completed), 'Completed tasks cleared.')}>Clear completed</button>}</div>
        </section>
        <footer className="page-footer"><span className="footer-line" /><Icon name="leaf" size={15} /><span>Less overwhelm. More getting there.</span><span className="footer-line" /></footer>
        <button className="mobile-azure-link" onClick={() => setShowAzure(true)}><Icon name="cloud" size={16} /> Explore Azure deployment <Icon name="arrow" size={14} /></button>
        <p role="status" className="sr-only">{announcement}</p>
      </div>
    </main>
    {editor && <TaskForm task={editor === 'new' ? undefined : editor} onSave={save} onClose={() => setEditor(null)} />}
    {showAzure && <Modal title="Take your little app to the cloud" onClose={() => setShowAzure(false)}><p className="modal-description">Practice with Azure Static Web Apps. This app runs entirely in your browser; no backend or Azure account is needed locally.</p><ol className="azure-steps"><li>Push this project to your own GitHub repository.</li><li>Create an Azure Static Web App and connect that repository.</li><li>Select React: app location <code>/</code>, no API location, output <code>dist</code>.</li><li>Open your deployed URL after the GitHub Actions build finishes.</li></ol><div className="info-note">Tasks stay in this browser, not in Azure. For your next exercise, add Azure Functions and a database for cross-device storage. Check current Azure pricing before creating resources.</div><a className="primary-button docs-link" href="https://learn.microsoft.com/azure/static-web-apps/get-started-portal" target="_blank" rel="noreferrer">Open the Azure guide <Icon name="arrow" size={17} /></a></Modal>}
  </div>
}

export default App
