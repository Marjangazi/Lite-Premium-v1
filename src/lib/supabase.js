import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bmaskqypvperqmidzcnl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYXNrcXlwdnBlcnFtaWR6Y25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3Njg4MzYsImV4cCI6MjA4NzM0NDgzNn0.N05XvTijaW9QZ0rtoTdyXcZxJOPoD5Hwu7WEZvdI5rY'

export const supabase = createClient(supabaseUrl, supabaseKey)
