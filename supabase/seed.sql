-- Seed data pour MÉNU v2.0

-- Insert marketplace items de démo
INSERT INTO public.marketplace_items (title, description, category, code, preview_url, rating, downloads, price, tags, is_approved)
VALUES 
    ('Dashboard Analytics Pro', 'Tableau de bord complet avec graphiques Recharts, KPIs et dark mode', 'dashboard', 
     'import React from "react";
export default function Dashboard() { return <div>Dashboard</div>; }', 
     'https://demo.menu.app/dashboard', 4.9, 2340, 0, ARRAY['React', 'Recharts', 'Tailwind', 'Dark Mode'], true),

    ('Boutique E-commerce', 'Template e-commerce complet avec panier, paiement Stripe et panel admin', 'ecommerce', 
     'import React from "react";
export default function Shop() { return <div>Shop</div>; }', 
     'https://demo.menu.app/ecommerce', 4.7, 1890, 0, ARRAY['Next.js', 'Stripe', 'Prisma', 'PostgreSQL'], true),

    ('CRM Pro', 'Gestion clients avancée avec pipeline, tâches, rapports et notifications', 'crm', 
     'import React from "react";
export default function CRM() { return <div>CRM</div>; }', 
     'https://demo.menu.app/crm', 4.8, 1560, 0, ARRAY['React', 'Node.js', 'PostgreSQL', 'Socket.io'], true),

    ('Formulaire Wizard', 'Formulaire multi-étapes avec validation Zod, progression et sauvegarde auto', 'form', 
     'import React from "react";
export default function Wizard() { return <div>Wizard</div>; }', 
     'https://demo.menu.app/form', 4.6, 3200, 0, ARRAY['React Hook Form', 'Zod', 'Framer Motion'], true),

    ('Admin Panel', 'Panneau d''administration avec tables CRUD, filtres et export Excel', 'dashboard', 
     'import React from "react";
export default function Admin() { return <div>Admin</div>; }', 
     'https://demo.menu.app/admin', 4.9, 4100, 0, ARRAY['React', 'TanStack Table', 'Shadcn UI'], true),

    ('Landing Page SaaS', 'Page d''accueil moderne pour SaaS avec pricing, FAQ et testimonials', 'template', 
     'import React from "react";
export default function Landing() { return <div>Landing</div>; }', 
     'https://demo.menu.app/landing', 4.5, 2800, 0, ARRAY['React', 'Framer Motion', 'Tailwind'], true)
ON CONFLICT DO NOTHING;

-- Insert analytics de démo
INSERT INTO public.analytics (user_id, projects_created, codes_generated, time_saved_hours, errors_fixed, credits_used, credits_remaining, features_used, date)
SELECT 
    auth.uid(),
    12,
    45,
    89,
    23,
    45,
    25,
    '{"generate": 25, "deploy": 8, "marketplace": 12}'::jsonb,
    CURRENT_DATE
FROM auth.users
LIMIT 1
ON CONFLICT DO NOTHING;