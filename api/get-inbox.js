import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.DATABASE_WEB, process.env.DATABASE_SECRET)

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { data, error } = await supabase
    .from('inbox')
    .select('id, from_email, subject, received_at, html, text')
    .eq('user_id', user.id)
    .order('received_at', { ascending: false })
    .limit(50)

  if (error) return res.status(400).json({ error: error.message })
  res.status(200).json({ emails: data })
}