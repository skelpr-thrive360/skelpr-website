import { ChevronRight } from 'lucide-react'

type Task = {
  id: string
  label: string
  tokens: readonly [number, number]
}

export function TaskTokenChart({ tasks, title, selectedTask, onSelect, formatTokens }: {
  tasks: readonly Task[]
  title: string
  selectedTask: string
  onSelect: (id: string) => void
  formatTokens: (tokens: number) => string
}) {
  const scale = Math.max(1, ...tasks.flatMap(({ tokens }) => tokens))
  return (
    <figure className="token-chart">
      <figcaption>
        <div>
          <h3>{title}</h3>
          <p>Select a task to read both answers. Bars share a scale within this study.</p>
        </div>
        <div className="token-chart-key">
          <span><i className="without-key" aria-hidden="true" /> Native tools</span>
          <span><i className="with-key" aria-hidden="true" /> With Skelpr MCP</span>
        </div>
      </figcaption>
      <ul className="token-chart-list">
        {tasks.map(({ id, label, tokens: [native, skelpr] }) => (
          <li key={id}>
            <button
              type="button"
              className="token-task"
              aria-pressed={selectedTask === id}
              aria-label={`${label}. ${formatTokens(native)} tokens with native tools, ${formatTokens(skelpr)} with Skelpr MCP. Read answers.`}
              onClick={() => onSelect(id)}
            >
              <span className="token-task-label">{label}</span>
              <span className="token-bars" aria-hidden="true">
                <span className="token-bar">
                  <span className="token-track"><span className="without-key" style={{ width: `${native / scale * 100}%` }} /></span>
                  <span>{formatTokens(native)}</span>
                </span>
                <span className="token-bar">
                  <span className="token-track"><span className="with-key" style={{ width: `${skelpr / scale * 100}%` }} /></span>
                  <span>{formatTokens(skelpr)}</span>
                </span>
              </span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </figure>
  )
}
