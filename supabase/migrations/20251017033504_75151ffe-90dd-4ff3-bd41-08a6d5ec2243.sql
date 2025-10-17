-- Create rate_limit_log table for rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_endpoint ON public.rate_limit_log(user_id, endpoint, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_endpoint ON public.rate_limit_log(ip_address, endpoint, created_at);

-- Enable RLS on rate_limit_log
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can view their own rate limit logs
CREATE POLICY "Users can view own rate limit logs"
ON public.rate_limit_log
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create security_audit_log table for security auditing
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient audit queries
CREATE INDEX IF NOT EXISTS idx_security_audit_user ON public.security_audit_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_action ON public.security_audit_log(action, created_at);

-- Enable RLS on security_audit_log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS policy: Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
ON public.security_audit_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id UUID,
  _ip_address TEXT,
  _endpoint TEXT,
  _max_requests INTEGER,
  _window_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_count INTEGER;
BEGIN
  -- Count requests in the time window
  SELECT COUNT(*) INTO request_count
  FROM public.rate_limit_log
  WHERE endpoint = _endpoint
    AND created_at > NOW() - (INTERVAL '1 minute' * _window_minutes)
    AND (
      (_user_id IS NOT NULL AND user_id = _user_id) OR
      (_user_id IS NULL AND ip_address = _ip_address)
    );
  
  -- Return true if under limit
  IF request_count < _max_requests THEN
    -- Log this request
    INSERT INTO public.rate_limit_log (user_id, ip_address, endpoint)
    VALUES (_user_id, _ip_address, _endpoint);
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  _user_id UUID,
  _action TEXT,
  _resource_type TEXT,
  _resource_id UUID,
  _ip_address TEXT,
  _user_agent TEXT,
  _status TEXT,
  _metadata JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    ip_address,
    user_agent,
    status,
    metadata
  ) VALUES (
    _user_id,
    _action,
    _resource_type,
    _resource_id,
    _ip_address,
    _user_agent,
    _status,
    _metadata
  );
END;
$$;

-- Clean up old rate limit logs (older than 24 hours) - for maintenance
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_logs()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limit_log
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;