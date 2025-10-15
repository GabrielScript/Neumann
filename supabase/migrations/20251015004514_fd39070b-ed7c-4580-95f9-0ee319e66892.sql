-- Allow Plus users to delete challenge items from default and public templates
DROP POLICY IF EXISTS "Users can delete own challenge items" ON public.challenge_items;

CREATE POLICY "Users can delete own challenge items"
ON public.challenge_items
FOR DELETE
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
  -- Plus users can delete items from default/public templates
  (
    has_plus_subscription(auth.uid())
    AND template_id IN (
      SELECT challenge_templates.id
      FROM challenge_templates
      WHERE challenge_templates.is_default = true OR challenge_templates.is_public = true
    )
  )
);

-- Allow Plus users to delete default and public challenge templates
CREATE POLICY "Plus users can delete default and public templates"
ON public.challenge_templates
FOR DELETE
USING (
  has_plus_subscription(auth.uid()) 
  AND (is_default = true OR is_public = true)
);