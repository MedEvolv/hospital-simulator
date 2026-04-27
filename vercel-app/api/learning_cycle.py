"""
POST /api/learning_cycle
Body: { run_id: str }
Authorization: Bearer <WORKFLOW_SECRET>

Triggered after every simulation run. Checks whether 3 unanalysed runs have
accumulated. If yes, runs LLM analysis and writes recommendations to Supabase.
If no, exits immediately.

This implements SAHI Recommendation 7: post-deployment monitoring for
real-world performance changes and unintended consequences — applied to the
tool itself.

Every recommendation requires human approval before application.
Nothing changes silently.
"""

import sys
import os
import json
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(__file__))

ANALYSIS_PROMPT = """You are reviewing the last 3 runs of Institutional Mirror, a hospital \
governance simulation tool. Your task is to identify patterns and generate improvement \
recommendations.

STRICT CONSTRAINTS — read before generating anything:
1. You may only recommend changes in two categories:
   - synthesis_copy: the language used in synthesis insights and governance questions
   - metric_threshold: numerical thresholds for when insights trigger (e.g., the debt
     level that triggers a CRITICAL insight, the drift value that triggers a HIGH signal)
2. You may NOT recommend changes to:
   - The moral reckoning logic or classification rules
   - Institutional profile parameters (what Government vs Private means)
   - The ontological boundaries or disclaimer language
   - The five core metrics or their definitions
3. Every recommendation must include:
   - The specific text or value currently used (current_value)
   - The specific text or value you recommend (recommended_value)
   - Your reasoning in 2–3 sentences
   - The evidence from the 3 runs that supports this recommendation
   - A SAHI anchor if applicable (which SAHI recommendation this supports)
4. Frame all recommendations as observations, not verdicts. The tool must never
   drift toward evaluating institutions — it helps institutions evaluate themselves.
5. If you find no meaningful patterns in 3 runs, return zero recommendations.
   Do not generate recommendations to appear thorough.

PREVIOUSLY REJECTED RECOMMENDATIONS (do not repeat these):
{rejected_context}

ACTIVE THRESHOLDS (current simulation_config):
{config_context}

RUNS TO ANALYSE:
{runs_json}

Return a JSON object with this exact structure — no other text:
{{
  "patterns_observed": ["pattern 1", "pattern 2"],
  "total_recommendations": 0,
  "recommendations": [
    {{
      "category": "synthesis_copy or metric_threshold",
      "target": "the specific field or config key name",
      "current_value": "...",
      "recommended_value": "...",
      "reasoning": "2–3 sentences",
      "evidence": {{"run_ids": [], "observations": "..."}},
      "sahi_anchor": "SAHI Recommendation N — [text] or null"
    }}
  ]
}}"""


def _supabase_client():
    from supabase import create_client
    return create_client(
        os.environ['SUPABASE_URL'],
        os.environ['SUPABASE_SERVICE_KEY'],
    )


def count_unanalysed_runs(supabase) -> list:
    """Return runs not yet included in any learning cycle."""
    analysed = supabase.table('learning_cycles').select('runs_analysed').execute()
    already_analysed_ids: set = set()
    for cycle in (analysed.data or []):
        already_analysed_ids.update(cycle.get('runs_analysed') or [])

    all_runs = supabase.table('simulation_runs') \
        .select('id, created_at, profile, duration_ticks, seed, result, survey_data, user_role_selected') \
        .order('created_at', desc=False) \
        .execute()

    unanalysed = [r for r in (all_runs.data or []) if r['id'] not in already_analysed_ids]
    return unanalysed


def fetch_active_config(supabase) -> dict:
    rows = supabase.table('simulation_config').select('key, value').execute()
    return {row['key']: row['value'] for row in (rows.data or [])}


def fetch_rejected_context(supabase) -> str:
    rejected = supabase.table('pending_recommendations') \
        .select('target, recommended_value, reasoning, review_note') \
        .eq('status', 'rejected') \
        .order('reviewed_at', desc=True) \
        .limit(10) \
        .execute()
    if not rejected.data:
        return 'None.'
    lines = []
    for r in rejected.data:
        note = r.get('review_note') or 'No reason given'
        lines.append(f"- Target: {r['target']} | Rejected because: {note}")
    return '\n'.join(lines)


def call_llm(prompt: str) -> dict:
    """Call DeepSeek API (OpenAI-compatible) with the analysis prompt."""
    from openai import OpenAI
    client = OpenAI(
        api_key=os.environ.get('DEEPSEEK_API_KEY', ''),
        base_url='https://api.deepseek.com',
    )
    completion = client.chat.completions.create(
        model='deepseek-chat',
        messages=[{'role': 'user', 'content': prompt}],
        max_tokens=1200,
        temperature=0.3,
        response_format={'type': 'json_object'},
    )
    return json.loads(completion.choices[0].message.content)


def write_cycle_and_recommendations(supabase, run_ids: list, analysis: dict):
    """Persist learning cycle and individual recommendations."""
    cycle_insert = supabase.table('learning_cycles').insert({
        'runs_analysed': run_ids,
        'run_count': len(run_ids),
        'llm_analysis': {
            'patterns_observed': analysis.get('patterns_observed', []),
        },
        'recommendations': analysis.get('recommendations', []),
        'status': 'pending',
    }).execute()

    cycle_id = cycle_insert.data[0]['id']

    for rec in analysis.get('recommendations', []):
        supabase.table('pending_recommendations').insert({
            'learning_cycle_id': cycle_id,
            'category': rec.get('category', 'synthesis_copy'),
            'target': rec.get('target', ''),
            'current_value': json.dumps(rec.get('current_value', '')),
            'recommended_value': json.dumps(rec.get('recommended_value', '')),
            'reasoning': rec.get('reasoning', ''),
            'evidence': rec.get('evidence', {}),
            'sahi_anchor': rec.get('sahi_anchor'),
            'status': 'pending',
        }).execute()

    return cycle_id, len(analysis.get('recommendations', []))


class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_POST(self):
        # Verify internal secret
        auth = self.headers.get('Authorization', '')
        expected = f"Bearer {os.environ.get('WORKFLOW_SECRET', '')}"
        if auth != expected:
            self._send_error(401, 'Unauthorized')
            return

        try:
            supabase = _supabase_client()

            # Step 1: count unanalysed runs
            unanalysed = count_unanalysed_runs(supabase)
            if len(unanalysed) < 3:
                self._send_json(200, {
                    'status': 'skipped',
                    'reason': f'only {len(unanalysed)} unanalysed run(s) — need 3',
                })
                return

            # Step 2: take the oldest 3
            batch = unanalysed[:3]
            run_ids = [r['id'] for r in batch]

            # Step 3: build context
            config = fetch_active_config(supabase)
            rejected_context = fetch_rejected_context(supabase)

            # Slim down run data before sending to LLM (no raw event log)
            slim_runs = []
            for r in batch:
                result = r.get('result') or {}
                slim_runs.append({
                    'id': r['id'],
                    'profile': r['profile'],
                    'duration_ticks': r['duration_ticks'],
                    'user_role_selected': r.get('user_role_selected'),
                    'performance_scores': result.get('performance_scores', {}),
                    'moral_reckoning_summary': {
                        'value_drift': {
                            'maximum_drift': result.get('moral_reckoning', {}).get('value_drift', {}).get('maximum_drift'),
                            'primary_misalignment': result.get('moral_reckoning', {}).get('value_drift', {}).get('primary_misalignment'),
                        },
                        'ethical_debt_total': result.get('moral_reckoning', {}).get('ethical_debt', {}).get('current_debt'),
                        'forced_harms': result.get('moral_reckoning', {}).get('harm_classifications', {}).get('summary', {}).get('forced_count'),
                        'avoidable_harms': result.get('moral_reckoning', {}).get('harm_classifications', {}).get('summary', {}).get('avoidable_count'),
                        'total_refusals': result.get('moral_reckoning', {}).get('refusals', {}).get('summary', {}).get('total_refusals'),
                    },
                    'synthesis_critical_question': result.get('synthesis', {}).get('critical_question'),
                })

            prompt = ANALYSIS_PROMPT.format(
                rejected_context=rejected_context,
                config_context=json.dumps(config, indent=2),
                runs_json=json.dumps(slim_runs, indent=2),
            )

            # Step 4: LLM analysis
            analysis = call_llm(prompt)

            # Step 5: persist
            cycle_id, rec_count = write_cycle_and_recommendations(supabase, run_ids, analysis)

            self._send_json(200, {
                'status': 'complete',
                'cycle_id': cycle_id,
                'runs_analysed': run_ids,
                'recommendations_written': rec_count,
                'patterns_observed': analysis.get('patterns_observed', []),
            })

        except Exception as exc:
            self._send_error(500, str(exc))

    def _send_json(self, status: int, data: dict):
        payload = json.dumps(data, default=str).encode('utf-8')
        self.send_response(status)
        self._send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _send_error(self, status: int, message: str):
        self._send_json(status, {'error': message})

    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def log_message(self, fmt, *args):
        pass
