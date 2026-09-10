import { ReactNode } from 'react'
import CodeBlock from '../components/CodeBlock'
import Callout from '../components/Callout'
import Toc from '../components/Toc'

const toc = [
  { id: 'project', label: 'Project structure' },
  { id: 'setup', label: 'Configure Express' },
  { id: 'root-view', label: 'Root view template' },
  { id: 'routes', label: 'CRUD routes' },
  { id: 'components', label: 'React components' },
  { id: 'shared', label: 'Shared props' },
  { id: 'partial', label: 'Partial reloads' },
  { id: 'vite', label: 'Vite config' },
  { id: 'run', label: 'Run the app' },
]

function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="mt-16 mb-4 scroll-mt-20 font-display text-4xl font-semibold tracking-tight text-primary"
    >
      <a
        href={`#${id}`}
        onClick={(e) => {
          e.preventDefault()
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
        }}
        className="heading-anchor-link mr-2 select-none"
      >
        #
      </a>
      {children}
    </h2>
  )
}

function P({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={['mb-4 text-base leading-relaxed text-secondary', className].join(' ')}>
      {children}
    </p>
  )
}

export default function Tutorial() {
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_13rem] xl:gap-10">
      <article className="mx-auto min-w-0 max-w-3xl">
        <h1 className="mb-4 mt-8 font-display text-4xl font-semibold tracking-tight text-primary lg:text-5xl">
          Tutorial: Task Manager
        </h1>
        <p className="mb-8 text-lg leading-normal text-secondary">
          Build a complete task management app with Express, Inertia, and React
          — routes, props, forms, navigation, and shared state.
        </p>

        <div className="mb-8 rounded-2xl bg-card p-6">
          <div className="mb-2 font-display text-base font-bold text-primary">
            You will learn
          </div>
          <ul className="list-inside space-y-1 text-secondary">
            <li>
              How to register the Inertia engine and middleware
            </li>
            <li>
              How to render pages with <code>res.inertia()</code>
            </li>
            <li>
              How to wire a React frontend with <code>useForm()</code>
            </li>
            <li>
              How to share props and use partial reloads
            </li>
          </ul>
        </div>

        <H2 id="project">Project structure</H2>
        <CodeBlock filename="Directory layout">
{`task-manager/
  src/
    app.js                    # Express app setup
    routes/
      tasks.js                # Task routes (CRUD)
  views/
    base.ejs                  # Root template
  resources/js/
    app.tsx                   # Inertia client entry
    Pages/
      Tasks/
        Index.tsx             # Task list
        Show.tsx              # Single task
        Create.tsx            # Create form
        Edit.tsx              # Edit form
  vite.config.ts
  package.json`}
        </CodeBlock>

        <H2 id="setup">Configure Express</H2>
        <P>Create the project and install dependencies:</P>
        <CodeBlock filename="Terminal">
{`mkdir task-manager && cd task-manager
npm init -y
npm install express ejs express-session @arponascension/express-inertia
npm install @inertiajs/react react react-dom
npm install -D vite @vitejs/plugin-react typescript`}
        </CodeBlock>

        <P className="mt-4">Set up the Express app:</P>
        <CodeBlock filename="src/app.js" showLineNumbers>
{`const express = require('express')
const session = require('express-session')
const { createInertiaEngine } = require('@arponascension/express-inertia/engine')
const { inertia } = require('@arponascension/express-inertia')

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Session storage for flash messages
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}))

// Register engine and middleware
app.engine('ejs', createInertiaEngine())
app.set('view engine', 'ejs')
app.set('views', 'views')

app.use(inertia({
  rootView: 'base',
  version: '1.0.0',
}))

app.use('/tasks', require('./routes/tasks'))
app.get('/', (req, res) => res.redirect('/tasks'))

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
})`}
        </CodeBlock>

        <H2 id="root-view">Root view template</H2>
        <CodeBlock filename="views/base.ejs" showLineNumbers>
{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Task Manager</title>
  @vite('resources/js/app.tsx')
</head>
<body>
  @inertia
</body>
</html>`}
        </CodeBlock>

        <H2 id="routes">CRUD routes</H2>
        <P>
          The heart of the app: every route calls{' '}
          <code>res.inertia()</code> with a component path and props.
        </P>
        <CodeBlock filename="src/routes/tasks.js" showLineNumbers>
{`const express = require('express')
const router = express.Router()

// In-memory store — replace with a real database
const tasks = []
let nextId = 1

// List all tasks
router.get('/', (req, res) => {
  res.inertia('Tasks/Index', {
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      created_at: t.createdAt,
    })),
    flash: req.session.flash || null,
  })
  req.session.flash = null
})

// Show the create form
router.get('/create', (req, res) => {
  res.inertia('Tasks/Create', { errors: {} })
})

// Store a new task
router.post('/', (req, res) => {
  const { title } = req.body
  const errors = {}

  if (!title || title.trim().length === 0) {
    errors.title = 'Title is required'
  }

  if (Object.keys(errors).length > 0) {
    return res.inertia('Tasks/Create', { errors })
  }

  tasks.push({
    id: nextId++,
    title: title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
  })

  req.session.flash = { success: 'Task created!' }
  res.redirect('/tasks')
})

// Show a single task
router.get('/:id', (req, res) => {
  const task = tasks.find((t) => t.id === Number(req.params.id))
  if (!task) return res.status(404).send('Not found')

  res.inertia('Tasks/Show', { task })
})

// Show the edit form
router.get('/:id/edit', (req, res) => {
  const task = tasks.find((t) => t.id === Number(req.params.id))
  if (!task) return res.status(404).send('Not found')

  res.inertia('Tasks/Edit', { task, errors: {} })
})

// Update a task
router.put('/:id', (req, res) => {
  const task = tasks.find((t) => t.id === Number(req.params.id))
  if (!task) return res.status(404).send('Not found')

  const { title, completed } = req.body
  const errors = {}

  if (!title || title.trim().length === 0) {
    errors.title = 'Title is required'
  }

  if (Object.keys(errors).length > 0) {
    return res.inertia('Tasks/Edit', { task, errors })
  }

  task.title = title.trim()
  task.completed = completed === 'on' || completed === true

  req.session.flash = { success: 'Task updated!' }
  res.redirect(\`/tasks/\${task.id}\`)
})

// Delete a task
router.delete('/:id', (req, res) => {
  const index = tasks.findIndex((t) => t.id === Number(req.params.id))
  if (index === -1) return res.status(404).send('Not found')

  tasks.splice(index, 1)
  req.session.flash = { success: 'Task deleted!' }
  res.redirect('/tasks')
})

module.exports = router`}
        </CodeBlock>

        <Callout type="note">
          The first argument to <code>res.inertia()</code> is a component path
          relative to your <code>Pages</code> directory. On Inertia requests, a
          server redirect after a <code>PUT</code>, <code>PATCH</code>, or{' '}
          <code>DELETE</code> is automatically rewritten to a 303 See Other, per
          the Inertia protocol.
        </Callout>

        <H2 id="components">React components</H2>
        <P>
          Boot the Inertia client so it can resolve pages:
        </P>
        <CodeBlock filename="resources/js/app.tsx" showLineNumbers>
{`import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true })
    return pages[\`./Pages/\${name}.tsx\`]
  },

  setup({ App, props, el }) {
    createRoot(el).render(<App {...props} />)
  },
})`}
        </CodeBlock>

        <P className="mt-4">The task list reads props straight from the route:</P>
        <CodeBlock filename="resources/js/Pages/Tasks/Index.tsx" showLineNumbers>
{`import { Link, router } from '@inertiajs/react'

interface Task {
  id: number
  title: string
  completed: boolean
  created_at: string
}

interface Props {
  tasks: Task[]
  flash: { success?: string } | null
}

export default function Index({ tasks, flash }: Props) {
  const handleDelete = (id: number) => {
    if (confirm('Delete this task?')) {
      router.delete(\`/tasks/\${id}\`)
    }
  }

  return (
    <main className="max-w-2xl p-8">
      <h1 className="text-3xl font-bold">Tasks</h1>

      {flash?.success && (
        <p className="text-green-600">{flash.success}</p>
      )}

      <Link href="/tasks/create">+ New Task</Link>

      {tasks.length === 0 ? (
        <p>No tasks yet. Create one!</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <Link href={\`/tasks/\${task.id}\`}>{task.title}</Link>
              <span>{task.completed ? 'Done' : 'Pending'}</span>
              <Link href={\`/tasks/\${task.id}/edit\`}>Edit</Link>
              <button onClick={() => handleDelete(task.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}`}
        </CodeBlock>

        <P className="mt-4">
          The create form uses <code>useForm()</code> to post directly through
          Inertia — no fetch, no JSON:
        </P>
        <CodeBlock filename="resources/js/Pages/Tasks/Create.tsx" showLineNumbers>
{`import { useForm } from '@inertiajs/react'

export default function Create({ errors }: { errors: Record<string, string> }) {
  const { data, setData, post, processing } = useForm({ title: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/tasks')
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="title">Title</label>
      <input
        id="title"
        type="text"
        value={data.title}
        onChange={(e) => setData('title', e.target.value)}
        autoFocus
      />
      {errors.title && <p>{errors.title}</p>}

      <button type="submit" disabled={processing}>
        {processing ? 'Creating...' : 'Create Task'}
      </button>
    </form>
  )
}`}
        </CodeBlock>

        <H2 id="shared">Shared props</H2>
        <P>
          Share data across every page — like the current user or flash
          messages — using the <code>shared</code> option:
        </P>
        <CodeBlock filename="src/app.js" showLineNumbers>
{`app.use(inertia({
  rootView: 'base',
  version: '1.0.0',
  shared: (req) => ({
    user: req.session.user || null,
    flash: req.session.flash || null,
  }),
}))`}
        </CodeBlock>
        <P>
          Every Inertia response now includes <code>user</code> and{' '}
          <code>flash</code> automatically — no need to pass them per route.
        </P>

        <H2 id="partial">Partial reloads</H2>
        <P>
          Refresh only the props you need instead of the whole page. Ideal for
          sidebars, counters, or notifications:
        </P>
        <CodeBlock filename="React component">
{`import { router } from '@inertiajs/react'

// Only reload the 'tasks' and 'stats' props
router.reload({ only: ['tasks', 'stats'] })`}
        </CodeBlock>
        <P className="mt-4">
          Guard expensive work server-side with{' '}
          <code>lazy()</code> so it only runs on partial reloads:
        </P>
        <CodeBlock filename="Route handler">
{`const { lazy } = require('@arponascension/express-inertia')

router.get('/dashboard', (req, res) => {
  res.inertia('Dashboard', {
    user: req.user,          // always sent
    stats: getStats(),       // cheap

    // Resolves only when 'recentOrders' is requested
    recentOrders: lazy(async () => getRecentOrders()),
  })
})`}
        </CodeBlock>

        <H2 id="vite">Vite config</H2>
        <P>
          Wire up Vite so <code>@vite('resources/js/app.tsx')</code> resolves to
          the dev server (via the <code>hot</code> file) or to hashed production
          assets:
        </P>
        <CodeBlock filename="vite.config.ts" showLineNumbers>
{`import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { inertiaVitePlugin } from '@arponascension/express-inertia/vite'

export default defineConfig({
  plugins: [react(), inertiaVitePlugin()],
  base: '/build/',
  build: {
    manifest: true,
    outDir: 'public/build',
    emptyOutDir: true,
    rollupOptions: { input: 'resources/js/app.tsx' },
  },
})`}
        </CodeBlock>

        <H2 id="run">Run the app</H2>
        <P>Start both servers:</P>
        <CodeBlock filename="Terminal">
{`# Terminal 1: Express backend
node src/app.js

# Terminal 2: Vite dev server
npx vite`}
        </CodeBlock>
        <P>
          Open <code>http://localhost:3000</code> and you'll have a working task
          manager with client-side navigation, flash messages, and validated
          forms — powered entirely by server-side routing.
        </P>

        <Callout type="pitfall">
          The Vite dev server handles HMR; the Express server handles routing.
          No API layer, no CORS, no duplicated state management.
        </Callout>

        <div className="mt-12 rounded-2xl bg-card p-6">
          <div className="mb-3 font-display text-base font-bold text-primary">
            What you've built
          </div>
          <ul className="list-inside space-y-1.5 text-secondary">
            <li>Server-side CRUD routes using Express controllers</li>
            <li>
              Inertia responses with <code>res.inertia()</code>
            </li>
            <li>React components rendered by the Inertia client</li>
            <li>Form handling with <code>useForm()</code> and validation</li>
            <li>Flash messages via shared props</li>
            <li>Partial reloads for performance</li>
          </ul>
        </div>
      </article>

      <Toc sections={toc} />
    </div>
  )
}