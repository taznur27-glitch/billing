
-- Fix 1: Replace permissive policies on business tables with role-aware policies

-- inventory
DROP POLICY IF EXISTS "Authenticated full access to inventory" ON inventory;
CREATE POLICY "Approved users can access inventory"
  ON inventory FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role));

-- sales
DROP POLICY IF EXISTS "Authenticated full access to sales" ON sales;
CREATE POLICY "Approved users can access sales"
  ON sales FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role));

-- parties
DROP POLICY IF EXISTS "Authenticated full access to parties" ON parties;
CREATE POLICY "Approved users can access parties"
  ON parties FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role));

-- returns
DROP POLICY IF EXISTS "Authenticated full access to returns" ON returns;
CREATE POLICY "Approved users can access returns"
  ON returns FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role));

-- transactions
DROP POLICY IF EXISTS "Authenticated full access to transactions" ON transactions;
CREATE POLICY "Approved users can access transactions"
  ON transactions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role));

-- Fix 2: Restrict profiles SELECT to own profile or approved admins/members
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view own profile or approved users can view all"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role));

-- Fix 3: Fix delete_requests WITH CHECK to enforce requested_by = auth.uid()
DROP POLICY IF EXISTS "Authenticated access to delete_requests" ON delete_requests;
CREATE POLICY "Users can view own or admin can view all delete_requests"
  ON delete_requests FOR SELECT TO authenticated
  USING (requested_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own delete_requests"
  ON delete_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid() AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role)));

CREATE POLICY "Admins can update delete_requests"
  ON delete_requests FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete delete_requests"
  ON delete_requests FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
