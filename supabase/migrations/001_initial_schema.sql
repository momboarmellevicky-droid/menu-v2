-- ============================================================
-- MÉNU v2.0 — Schéma Supabase Complet
-- À coller dans : SQL Editor → New query → Run
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. TABLE : profiles (profils utilisateurs)
-- Extension de la table auth.users de Supabase
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'team')),
    credits INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger : créer automatiquement le profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, credits)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url',
        30
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Trigger : mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 3. TABLE : projects (projets utilisateurs)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    architecture TEXT DEFAULT 'frontend' CHECK (architecture IN ('frontend', 'fullstack', 'mobile')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'error')),
    memory JSONB DEFAULT '{
        "vision": "",
        "architecture": "",
        "history": [],
        "preferences": {},
        "components": []
    }'::jsonb,
    collaborators UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 4. TABLE : generated_codes (codes générés)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.generated_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    prompt TEXT NOT NULL,
    code TEXT NOT NULL,
    language TEXT DEFAULT 'tsx',
    framework TEXT DEFAULT 'react',
    agent_logs JSONB DEFAULT '[]'::jsonb,
    is_validated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. TABLE : code_repairs (corrections automatiques)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.code_repairs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code_id UUID REFERENCES public.generated_codes(id) ON DELETE CASCADE,
    original_code TEXT NOT NULL,
    fixed_code TEXT NOT NULL,
    errors TEXT[] DEFAULT '{}',
    warnings TEXT[] DEFAULT '{}',
    language TEXT DEFAULT 'tsx',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. TABLE : marketplace_items (templates communautaires)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.marketplace_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('dashboard', 'crm', 'ecommerce', 'form', 'template')),
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    code TEXT,
    preview_url TEXT,
    rating DECIMAL(2,1) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
    downloads INTEGER DEFAULT 0,
    price INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. TABLE : deployments (déploiements)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deployments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    platform TEXT CHECK (platform IN ('web', 'pwa', 'android', 'ios')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'building', 'deployed', 'error')),
    url TEXT,
    build_logs TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deployed_at TIMESTAMPTZ
);

-- ============================================================
-- 8. TABLE : team_members (membres d'équipe)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    invited_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- ============================================================
-- 9. TABLE : analytics (statistiques utilisateur)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    projects_created INTEGER DEFAULT 0,
    codes_generated INTEGER DEFAULT 0,
    time_saved_hours INTEGER DEFAULT 0,
    errors_fixed INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    credits_remaining INTEGER DEFAULT 30,
    features_used JSONB DEFAULT '{}'::jsonb,
    date DATE DEFAULT CURRENT_DATE,
    UNIQUE(user_id, date)
);

-- ============================================================
-- 10. ROW LEVEL SECURITY (RLS) — ACTIVER
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. POLICIES — profiles
-- ============================================================
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- ============================================================
-- 12. POLICIES — projects
-- ============================================================
DROP POLICY IF EXISTS "Projects viewable by owner or collaborators" ON public.projects;
CREATE POLICY "Projects viewable by owner or collaborators" 
    ON public.projects FOR SELECT 
    USING (
        auth.uid() = user_id OR 
        auth.uid() = ANY(collaborators)
    );

DROP POLICY IF EXISTS "Projects insertable by authenticated users" ON public.projects;
CREATE POLICY "Projects insertable by authenticated users" 
    ON public.projects FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Projects updatable by owner" ON public.projects;
CREATE POLICY "Projects updatable by owner" 
    ON public.projects FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Projects deletable by owner" ON public.projects;
CREATE POLICY "Projects deletable by owner" 
    ON public.projects FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================================
-- 13. POLICIES — generated_codes
-- ============================================================
DROP POLICY IF EXISTS "Codes viewable by project owner or collaborators" ON public.generated_codes;
CREATE POLICY "Codes viewable by project owner or collaborators" 
    ON public.generated_codes FOR SELECT 
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = generated_codes.project_id 
            AND (p.user_id = auth.uid() OR auth.uid() = ANY(p.collaborators))
        )
    );

DROP POLICY IF EXISTS "Codes insertable by authenticated users" ON public.generated_codes;
CREATE POLICY "Codes insertable by authenticated users" 
    ON public.generated_codes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 14. POLICIES — code_repairs
-- ============================================================
DROP POLICY IF EXISTS "Repairs viewable by code owner" ON public.code_repairs;
CREATE POLICY "Repairs viewable by code owner" 
    ON public.code_repairs FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.generated_codes c 
            WHERE c.id = code_repairs.code_id AND c.user_id = auth.uid()
        )
    );

-- ============================================================
-- 15. POLICIES — marketplace_items
-- ============================================================
DROP POLICY IF EXISTS "Marketplace items are viewable by everyone" ON public.marketplace_items;
CREATE POLICY "Marketplace items are viewable by everyone" 
    ON public.marketplace_items FOR SELECT 
    USING (is_approved = true OR auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can insert their items" ON public.marketplace_items;
CREATE POLICY "Authors can insert their items" 
    ON public.marketplace_items FOR INSERT 
    WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their items" ON public.marketplace_items;
CREATE POLICY "Authors can update their items" 
    ON public.marketplace_items FOR UPDATE 
    USING (auth.uid() = author_id);

-- ============================================================
-- 16. POLICIES — deployments
-- ============================================================
DROP POLICY IF EXISTS "Deployments viewable by project owner" ON public.deployments;
CREATE POLICY "Deployments viewable by project owner" 
    ON public.deployments FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = deployments.project_id AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Deployments insertable by project owner" ON public.deployments;
CREATE POLICY "Deployments insertable by project owner" 
    ON public.deployments FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = deployments.project_id AND p.user_id = auth.uid()
        )
    );

-- ============================================================
-- 17. POLICIES — team_members
-- ============================================================
DROP POLICY IF EXISTS "Team members viewable by project members" ON public.team_members;
CREATE POLICY "Team members viewable by project members" 
    ON public.team_members FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = team_members.project_id 
            AND (p.user_id = auth.uid() OR auth.uid() = ANY(p.collaborators))
        )
    );

DROP POLICY IF EXISTS "Owners can manage team members" ON public.team_members;
CREATE POLICY "Owners can manage team members" 
    ON public.team_members FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = team_members.project_id AND p.user_id = auth.uid()
        )
    );

-- ============================================================
-- 18. POLICIES — analytics
-- ============================================================
DROP POLICY IF EXISTS "Analytics viewable by owner" ON public.analytics;
CREATE POLICY "Analytics viewable by owner" 
    ON public.analytics FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Analytics insertable by owner" ON public.analytics;
CREATE POLICY "Analytics insertable by owner" 
    ON public.analytics FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Analytics updatable by owner" ON public.analytics;
CREATE POLICY "Analytics updatable by owner" 
    ON public.analytics FOR UPDATE 
    USING (auth.uid() = user_id);

-- ============================================================
-- 19. INDEXES (performance)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generated_codes_project_id ON public.generated_codes(project_id);
CREATE INDEX IF NOT EXISTS idx_generated_codes_user_id ON public.generated_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_codes_created_at ON public.generated_codes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_code_repairs_code_id ON public.code_repairs(code_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_category ON public.marketplace_items(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_approved ON public.marketplace_items(is_approved);
CREATE INDEX IF NOT EXISTS idx_marketplace_downloads ON public.marketplace_items(downloads DESC);

CREATE INDEX IF NOT EXISTS idx_deployments_project_id ON public.deployments(project_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON public.deployments(status);

CREATE INDEX IF NOT EXISTS idx_team_members_project_id ON public.team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.analytics(date DESC);

-- ============================================================
-- 20. DONNÉES DE DÉMONSTRATION (optionnel)
-- ============================================================
INSERT INTO public.marketplace_items (title, description, category, code, preview_url, rating, downloads, price, tags, is_approved)
VALUES 
    ('Dashboard Analytics', 'Tableau de bord complet avec graphiques Recharts et KPIs', 'dashboard', '<!-- Dashboard code -->', 'https://demo.menu.app/dashboard', 4.9, 2340, 0, ARRAY['React', 'Recharts', 'Tailwind'], true),
    ('Boutique E-commerce', 'Template e-commerce avec panier, paiement Stripe et admin', 'ecommerce', '<!-- Ecommerce code -->', 'https://demo.menu.app/ecommerce', 4.7, 1890, 0, ARRAY['Next.js', 'Stripe', 'Prisma'], true),
    ('CRM Pro', 'Gestion clients avec pipeline, tâches et rapports', 'crm', '<!-- CRM code -->', 'https://demo.menu.app/crm', 4.8, 1560, 0, ARRAY['React', 'Node.js', 'PostgreSQL'], true),
    ('Formulaire Wizard', 'Formulaire multi-étapes avec validation Zod', 'form', '<!-- Form code -->', 'https://demo.menu.app/form', 4.6, 3200, 0, ARRAY['React Hook Form', 'Zod', 'Framer'], true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 21. FONCTIONS UTILITAIRES
-- ============================================================

-- Fonction : incrémenter les downloads marketplace
CREATE OR REPLACE FUNCTION public.increment_downloads(item_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.marketplace_items 
    SET downloads = downloads + 1 
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction : mettre à jour les crédits
CREATE OR REPLACE FUNCTION public.update_credits(user_uuid UUID, amount INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE public.profiles 
    SET credits = GREATEST(0, credits + amount) 
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction : ajouter un collaborateur au projet
CREATE OR REPLACE FUNCTION public.add_collaborator(project_uuid UUID, user_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.projects 
    SET collaborators = array_append(collaborators, user_uuid) 
    WHERE id = project_uuid AND NOT user_uuid = ANY(collaborators);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VÉRIFICATION
-- ============================================================
SELECT 'Tables créées avec succès' as status;
