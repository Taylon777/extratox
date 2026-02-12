-- Remove overly permissive write policies on bank_detection_patterns
-- These patterns are shared resources and should be read-only for regular users
-- Management should be done via migrations only

DROP POLICY IF EXISTS "Authenticated users can manage patterns" ON public.bank_detection_patterns;
DROP POLICY IF EXISTS "Authenticated users can update patterns" ON public.bank_detection_patterns;
DROP POLICY IF EXISTS "Authenticated users can delete patterns" ON public.bank_detection_patterns;