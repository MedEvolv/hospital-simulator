export default function Disclaimer() {
  return (
    <div className="border-t border-slate-800 mt-12 pt-6 pb-8">
      <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
        <span className="text-slate-400 font-medium">Simulation only. </span>
        This is a governance and institutional self-reflection tool. It uses synthetic data and
        parameterised profiles. It does not make clinical decisions, diagnose conditions, or
        evaluate real patients. It is not a performance ranking tool, a predictive triage
        system, or a justification for austerity measures.{' '}
        <span className="text-slate-400">
          This tool does not evaluate your hospital. It helps your hospital evaluate itself.
        </span>{' '}
        Designed for governance literacy and institutional self-awareness, in alignment with
        India&rsquo;s Strategy for AI in Healthcare (SAHI, 2026) — specifically Recommendations
        6, 7, 19, and 22 on transparency, monitoring, designated governance capacity, and
        escalation mechanisms. Publicly accessible — no institutional relationship or permission
        required to run a simulation.
      </p>
    </div>
  )
}
