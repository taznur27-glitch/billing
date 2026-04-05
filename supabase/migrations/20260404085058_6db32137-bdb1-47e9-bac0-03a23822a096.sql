
CREATE TABLE public.parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  type TEXT NOT NULL CHECK (type IN ('Dealer', 'Customer')),
  city TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access to parties" ON public.parties FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imei TEXT UNIQUE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  ram TEXT NOT NULL,
  storage TEXT NOT NULL,
  color TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('New', 'Refurbished', 'Used')),
  purchase_source TEXT NOT NULL CHECK (purchase_source IN ('Dealer', 'Customer')),
  supplier_id UUID REFERENCES public.parties(id),
  purchase_price DECIMAL(10,2) NOT NULL,
  purchase_date DATE NOT NULL,
  warranty_status TEXT NOT NULL CHECK (warranty_status IN ('Under Warranty', 'No Warranty', 'Extended Warranty')),
  warranty_expiry DATE,
  status TEXT NOT NULL DEFAULT 'In Stock' CHECK (status IN ('In Stock', 'Sold', 'Returned')),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access to inventory" ON public.inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imei TEXT NOT NULL REFERENCES public.inventory(imei),
  customer_id UUID REFERENCES public.parties(id),
  selling_price DECIMAL(10,2) NOT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'UPI', 'Bank Transfer', 'Credit')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access to sales" ON public.sales FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_type TEXT NOT NULL CHECK (return_type IN ('Sales Return', 'Purchase Return')),
  imei TEXT NOT NULL REFERENCES public.inventory(imei),
  party_id UUID REFERENCES public.parties(id),
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  return_reason TEXT NOT NULL,
  amount_refunded DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access to returns" ON public.returns FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('Purchase', 'Sale', 'Purchase Return', 'Sales Return')),
  imei TEXT REFERENCES public.inventory(imei),
  party_id UUID REFERENCES public.parties(id),
  txn_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access to transactions" ON public.transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
