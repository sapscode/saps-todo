import test from 'node:test'
import assert from 'node:assert/strict'
import { dateKey, filterTodos, loadTodos, starterTodos } from '../src/todos.ts'
import type { Todo } from '../src/todos.ts'

const tasks: Todo[] = [
  { id: 'a', title: 'Learn Azure', notes: 'Deploy React', category: 'Learning', priority: 'High', due: '2026-10-29', completed: false, createdAt: 1 },
  { id: 'b', title: 'Plan project', notes: '', category: 'Work', priority: 'Low', due: '2026-10-30', completed: false, createdAt: 2 },
  { id: 'c', title: 'Take a walk', notes: '', category: 'Personal', priority: 'Medium', due: '2026-10-31', completed: false, createdAt: 3 },
  { id: 'd', title: 'Read a book', notes: '', category: 'Personal', priority: 'Low', due: '2026-10-30', completed: true, createdAt: 4 },
  { id: 'e', title: 'No deadline', notes: '', category: 'Work', priority: 'Medium', due: '', completed: false, createdAt: 5 },
]
const defaults = { view: 'All tasks' as const, category: 'All' as const, query: '', status: 'All', sort: 'created', today: '2026-10-30' }
const ids = (items: Todo[]) => items.map((item) => item.id)

test('starter data round trips and an empty saved list stays empty', () => {
  assert.deepEqual(loadTodos(JSON.stringify(starterTodos())), starterTodos())
  assert.deepEqual(loadTodos('[]'), [])
  assert.equal(loadTodos(null).length, 6)
})
test('corrupt data, duplicate IDs, bad dates and invalid fields are rejected', () => {
  for (const raw of ['{', '{}', '[null]', JSON.stringify([tasks[0], tasks[0]]),
    JSON.stringify([{ ...tasks[0], due: '2026-02-30' }]), JSON.stringify([{ ...tasks[0], priority: 'Urgent' }]),
    JSON.stringify([{ ...tasks[0], title: '  ' }]), JSON.stringify([{ ...tasks[0], completed: 'true' }])]) {
    assert.throws(() => loadTodos(raw))
  }
})
test('today and upcoming exclude completed, overdue and undated tasks', () => {
  assert.deepEqual(ids(filterTodos(tasks, { ...defaults, view: 'Today' })), ['b'])
  assert.deepEqual(ids(filterTodos(tasks, { ...defaults, view: 'Upcoming' })), ['c'])
  assert.deepEqual(ids(filterTodos(tasks, { ...defaults, view: 'Completed' })), ['d'])
})
test('search includes notes, trims whitespace and combines with filters', () => {
  assert.deepEqual(ids(filterTodos(tasks, { ...defaults, query: ' REACT ', category: 'Learning', status: 'Active' })), ['a'])
  assert.deepEqual(ids(filterTodos(tasks, { ...defaults, category: 'Personal', status: 'Done' })), ['d'])
  assert.deepEqual(filterTodos(tasks, { ...defaults, query: 'not found' }), [])
})
test('sorting handles priority and undated tasks without mutating source', () => {
  assert.deepEqual(ids(filterTodos(tasks, { ...defaults, sort: 'priority' })), ['a', 'e', 'c', 'd', 'b'])
  assert.deepEqual(ids(filterTodos(tasks, { ...defaults, sort: 'due' })), ['a', 'd', 'b', 'c', 'e'])
  assert.deepEqual(ids(tasks), ['a', 'b', 'c', 'd', 'e'])
})
test('date keys use local calendar dates', () => {
  assert.equal(dateKey(new Date(2026, 0, 2, 0, 15)), '2026-01-02')
})
