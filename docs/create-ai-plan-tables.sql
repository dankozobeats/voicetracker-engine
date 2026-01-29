-- =====================================================
-- Migration : Tables pour les plans IA multi-etapes
-- =====================================================

-- ========================================
-- ETAPE 1 : Table ai_plans
-- ========================================

CREATE TABLE IF NOT EXISTS ai_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'EXPIRED', 'COMPLETED', 'FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_plans_user_id ON ai_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_plans_status ON ai_plans(status);

ALTER TABLE ai_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own AI plans"
  ON ai_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI plans"
  ON ai_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI plans"
  ON ai_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI plans"
  ON ai_plans FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- ETAPE 2 : Table ai_plan_steps
-- ========================================

CREATE TABLE IF NOT EXISTS ai_plan_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES ai_plans(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL CHECK (step_index >= 1 AND step_index <= 5),
  action_type TEXT NOT NULL
    CHECK (action_type IN ('CREATE_TRANSACTION', 'CREATE_BUDGET', 'RUN_PROJECTION')),
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  UNIQUE (plan_id, step_index)
);

CREATE INDEX IF NOT EXISTS idx_ai_plan_steps_plan_id ON ai_plan_steps(plan_id);

ALTER TABLE ai_plan_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own AI plan steps"
  ON ai_plan_steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM ai_plans
    WHERE ai_plans.id = ai_plan_steps.plan_id
      AND ai_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own AI plan steps"
  ON ai_plan_steps FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM ai_plans
    WHERE ai_plans.id = ai_plan_steps.plan_id
      AND ai_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own AI plan steps"
  ON ai_plan_steps FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM ai_plans
    WHERE ai_plans.id = ai_plan_steps.plan_id
      AND ai_plans.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ai_plans
    WHERE ai_plans.id = ai_plan_steps.plan_id
      AND ai_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own AI plan steps"
  ON ai_plan_steps FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM ai_plans
    WHERE ai_plans.id = ai_plan_steps.plan_id
      AND ai_plans.user_id = auth.uid()
  ));
