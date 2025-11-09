uducts.';
comment on column public.products.asin is 'Amazon Standard Identification Number. Unique identifier for Amazon products.';
comment on column public.products.attributes is 'JSON object containing variant attributes (e.g., {"color": "red", "size": "M"})';

-- RLS policies remain the same - variants inherit permissions from parent product via seller_id
