-- ============================================================
-- MÉNU v2.0 — Abonnements et paiements SingPay
-- À coller dans : SQL Editor → New query → Run
-- ============================================================

-- Le plan actuel de l'utilisateur, distinct des crédits (les crédits sont
-- consommés à l'usage, le plan détermine le quota mensuel qui leur est
-- réattribué).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  ADD COLUMN IF NOT EXISTS plan_renews_at TIMESTAMPTZ;

-- Historique des paiements SingPay, un enregistrement par tentative
-- (permet de retrouver une transaction en attente et de vérifier son
-- statut sans dépendre uniquement de la mémoire côté client).
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan TEXT NOT NULL CHECK (plan IN ('pro', 'team')),
    amount_fcfa INTEGER NOT NULL,
    operator TEXT NOT NULL CHECK (operator IN ('airtel', 'moov')),
    phone_number TEXT NOT NULL,
    reference TEXT NOT NULL UNIQUE,
    transaction_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs voient leurs propres paiements"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- Aucune policy INSERT/UPDATE côté client : toutes les écritures passent
-- par le backend (clé service_role), pour empêcher un utilisateur de
-- s'auto-attribuer un plan payant sans paiement réel confirmé.
