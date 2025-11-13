-- This seed file populates the database with a test user and initial data.
-- You can run this file in the Supabase SQL Editor or use `supabase db reset`.

-- 1. Create a test user
-- Replace with your own test user details if desired.
-- The password is 'password'.
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token_encrypted)
VALUES
    ('00000000-0000-0000-0000-000000000000', '8a555a3c-5c3c-46b5-82e7-78b17a6a0279', 'authenticated', 'authenticated', 'test@example.com', '$2a$10$w4B.MAj132aN0ITyB6P/8e1x8G0FvNUnv2SIVv.pdbxncgJq1Q/Lm', '2024-01-01 00:00:00.000000+00', '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', '2024-01-01 00:00:00.000000+00', '2024-01-01 00:00:00.000000+00', '', '', '', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  ('0c54117b-c999-4c17-a9a9-305e54b3582e', '8a555a3c-5c3c-46b5-82e7-78b17a6a0279', '{"sub": "8a555a3c-5c3c-46b5-82e7-78b17a6a0279", "email": "test@example.com"}', 'email', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- 2. Create the user's profile
INSERT INTO public.profiles (id, name, nickname, age, conditions, potassium_level)
VALUES
    ('8a555a3c-5c3c-46b5-82e7-78b17a6a0279', 'Iracy Amancio Da Silva Gonçalves', 'Cyca', 65, ARRAY['diabetes', 'insuficiência cardíaca (fração de ejeção de 30%)', 'problemas renais'], 6.9)
ON CONFLICT (id) DO NOTHING;

-- 3. Add medications for the user
-- Note: We use a subquery to get the user_id dynamically.
WITH user_info AS (
  SELECT id FROM auth.users WHERE email = 'test@example.com' LIMIT 1
)
INSERT INTO public.medications (user_id, name, dosage, "time")
VALUES
    ((SELECT id FROM user_info), 'Furosemida', '40mg', '09:00'),
    ((SELECT id FROM user_info), 'Enalapril', '10mg', '09:00'),
    ((SELECT id FROM user_info), 'Carvedilol', '6.25mg', '09:00 e 21:00'),
    ((SELECT id FROM user_info), 'Espironolactona', '25mg', '12:00'),
    ((SELECT id FROM user_info), 'Metformina', '500mg', 'Após almoço e jantar')
ON CONFLICT DO NOTHING;

-- 4. Add food preferences
WITH user_info AS (
  SELECT id FROM auth.users WHERE email = 'test@example.com' LIMIT 1
)
INSERT INTO public.food_preferences (user_id, food, preference)
VALUES
    ((SELECT id FROM user_info), 'Frango grelhado', 'like'),
    ((SELECT id FROM user_info), 'Abobrinha', 'like'),
    ((SELECT id FROM user_info), 'Jiló', 'dislike')
ON CONFLICT (user_id, food) DO NOTHING;
