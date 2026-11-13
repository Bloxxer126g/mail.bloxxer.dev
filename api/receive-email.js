import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(process.env.DATABASE_WEB, process.env.DATABASE_SECRET)
const resend = new Resend(process.env.RESEND)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const event = req.body
  if (event.type !== 'email.received') return res.status(200).end()

  const { email_id, from, to, subject } = event.data

  try {
    // Webhooks only carry metadata; fetch the body separately
    const { data: full } = await resend.emails.receiving.get(email_id)

    // Match recipient address to a user
    const recipient = (Array.isArray(to) ? to[0] : to).toLowerCase()
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('newemail', recipient)
      .single()

    if (!user) return res.status(200).end() // unknown address, drop it

    await supabase.from('inbox').insert({
      resend_id: email_id,
      user_id: user.id,
      from_email: from,
      to_email: recipient,
      subject,
      html: full?.html,
      text: full?.text
    })

    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}