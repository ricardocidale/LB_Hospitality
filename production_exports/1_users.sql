-- Step 1: Users
-- Run this FIRST in the production database

INSERT INTO users (id, email, password_hash, role, name, created_at, updated_at, company, title) VALUES
(1, 'admin', '$2b$12$PvGzZOoeGDfNS1xjuBpcNu.Xgp3.vCX82bW0dU7xdFcoA9/uZHowq', 'admin', 'Ricardo Cidale', '2026-01-27 00:22:53.560822', '2026-02-02 17:01:28.789', 'Norfolk Group', 'Partner'),
(2, 'rosario@kitcapital.com', '$2b$12$2AtbFcvAfiT2mEYMIXPF0uvwZR764dP2HGtGsq1hfZLgFuYmJ7xaq', 'user', 'Rosario David', '2026-01-27 00:41:44.306456', '2026-02-02 17:08:28.796', 'KIT Capital', 'COO'),
(4, 'kit@kitcapital.com', '$2b$12$WO8kXNE7E5VchZfVvUddoOaNZGDagOVGIFxDIForV9bQRSLzF8nYm', 'user', 'Dov Tuzman', '2026-02-02 16:09:26.02703', '2026-02-02 17:08:22.783', 'KIT Capital', 'Principal'),
(5, 'checker@norfolkgroup.io', '$2b$12$xypFNG4Xy9l097nQtuqBSOpYgWvB.QIq786Ni.jxi/C22XXqsdnIm', 'user', 'Checker User', '2026-02-02 16:33:13.844808', '2026-02-02 17:09:16.141', 'Norfolk', 'Verification manager')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  company = EXCLUDED.company,
  title = EXCLUDED.title,
  updated_at = EXCLUDED.updated_at;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
