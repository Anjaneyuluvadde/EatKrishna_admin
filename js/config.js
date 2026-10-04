const SUPABASE_URL = "https://qknkvqjpmmmpjkddqbal.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrbmt2cWpwbW1tcGprZGRxYmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNDUzMjgsImV4cCI6MjA4NDgyMTMyOH0.4QpOm1DDI3ZUCJQczaIJlQR5aNVEK8pr8kz6plyKYaM";

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
