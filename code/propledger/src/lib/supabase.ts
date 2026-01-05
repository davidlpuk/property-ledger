import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ouxshnkvsovrnkxgjvhq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91eHNobmt2c292cm5reGdqdmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjczNjAsImV4cCI6MjA4MzA0MzM2MH0.Hjxxjy8G0Pj-y1xP0Hy7FSuEd1JxD5xl5wVbxTsjQq8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
