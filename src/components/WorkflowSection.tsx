import { workflowSteps } from '../data/siteData'

/**
 * The MCP Agent pipeline, as a static strip.
 *
 * Deliberately not interactive any more. This is the least load-bearing section on
 * the page, and the autoplaying walkthrough it used to be — an IntersectionObserver,
 * a timer, a tablist, a terminal trace and a detail toggle — cost more to keep
 * honest than it earned. The step labels still come from the shared `workflowSteps`
 * data, so the pipeline tracks the code; only the presentation was cut back.
 *
 * `id="workflow"` has to stay: the hero's primary call to action and the primary
 * navigation both point at it.
 */
export function WorkflowSection() {
  return (
    <section className="workflow-section content-section" id="workflow">
      <div className="section-kicker">How it works</div>
      <div className="workflow-heading">
        <div><h2>A live path from <em>question</em><br />to cited context.</h2></div>
        <p>The MCP Agent integration is a boundary between an agent’s reasoning and a repository’s evidence. Your agent asks; skelpr retrieves, ranks and cites, and hands back a small package with <code>file:line</code> locations. It never does the reasoning.</p>
      </div>
      <div className="tool-row">
        <span>Pipeline</span>
        {workflowSteps.map((step) => <code key={step.id}>{step.label}</code>)}
      </div>
      {/* Seven tools, matching the seven server.add_tool() calls in
          skelpr/integrations/mcp_server.py. This row used to stop at health and the
          section said six, while the architecture copy on the same page already
          claimed seven — including AST patching. */}
      <div className="tool-row">
        <span>MCP Agent exposes</span>
        <code>skelpr_search</code>
        <code>skelpr_get_context</code>
        <code>skelpr_find_symbol</code>
        <code>skelpr_dependencies</code>
        <code>skelpr_validate</code>
        <code>skelpr_health</code>
        <code>skelpr_apply_ast_patch</code>
      </div>
    </section>
  )
}
