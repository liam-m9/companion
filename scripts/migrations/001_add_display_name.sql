-- Phase 3: Add display_name to profiles
-- Run this in Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
