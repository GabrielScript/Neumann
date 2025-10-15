-- Allow Plus users to update challenge items from default and public templates
DROP POLICY IF EXISTS "Users can update own challenge items" ON public.challenge_items;

CREATE POLICY "Users can update own challenge items"
ON public.challenge_items
FOR UPDATE
USING (
  (challenge_id IN (
    SELECT challenges.id
    FROM challenges
    WHERE challenges.user_id = auth.uid()
  ))
  OR 
  (template_id IN (
    SELECT challenge_templates.id
    FROM challenge_templates
    WHERE challenge_templates.created_by = auth.uid()
  ))
  OR
  -- Plus users can update items from default/public templates
  (
    has_plus_subscription(auth.uid())
    AND template_id IN (
      SELECT challenge_templates.id
      FROM challenge_templates
      WHERE challenge_templates.is_default = true OR challenge_templates.is_public = true
    )
  )
);