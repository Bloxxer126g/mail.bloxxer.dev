const composeBox = document.getElementById('Email')
const loginPopup = document.getElementById('LoginPopup')
const inboxPanel = document.getElementById('InboxPanel')
const inboxList = document.getElementById('InboxList')
const inboxViewer = document.getElementById('InboxViewer')

function showLogin() {
  composeBox.style.display = 'none'
  inboxPanel.style.display = 'none'
  loginPopup.style.display = 'flex'
}

function showCompose() {
  loginPopup.style.display = 'none'
  inboxPanel.style.display = 'none'
  composeBox.style.display = 'flex'
}

function showInbox() {
  loginPopup.style.display = 'none'
  composeBox.style.display = 'none'
  inboxPanel.style.display = 'flex'
  loadInbox()
}

async function loadInbox() {
  inboxViewer.replaceChildren()
  inboxList.textContent = 'Loading...'
  try {
    const res = await fetch('/api/get-inbox', {
      headers: { Authorization: `Bearer ${localStorage.getItem('sessionToken')}` }
    })
    if (res.status === 401) {
      localStorage.clear()
      showLogin()
      return
    }
    const { emails, error } = await res.json()
    if (error) { inboxList.textContent = error; return }
    if (!emails.length) { inboxList.textContent = 'No mail yet.'; return }

    inboxList.replaceChildren()
    for (const m of emails) {
      const row = document.createElement('div')
      row.className = 'InboxRow'
      row.textContent = `${m.from_email} — ${m.subject || '(no subject)'}`
      row.onclick = () => showEmail(m)
      inboxList.appendChild(row)
    }
  } catch (e) {
    inboxList.textContent = 'Error: ' + e.message
  }
}

function showEmail(m) {
  const frame = document.createElement('iframe')
  frame.sandbox = ''
  frame.style.width = '100%'
  frame.style.height = '400px'
  frame.srcdoc = m.html || `<pre>${(m.text || '').replace(/</g, '&lt;')}</pre>`
  inboxViewer.replaceChildren(frame)
}

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('sessionToken')) showCompose()
  else showLogin()
})

document.getElementById('ComposeTab').addEventListener('click', showCompose)
document.getElementById('InboxTab').addEventListener('click', showInbox)
document.getElementById('ComposeTab2').addEventListener('click', showCompose)
document.getElementById('InboxTab2').addEventListener('click', showInbox)
document.getElementById('RefreshInbox').addEventListener('click', loadInbox)

document.getElementById('LoginButton').addEventListener('click', async () => {
  const email = document.getElementById('EmailHeader').value
  const password = document.getElementById('PasswordHeader').value
  if (!email || !password) {
    alert('Please fill in all fields!')
    return
  }
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const result = await response.json()
    if (result.session && result.error == null) {
      localStorage.setItem('sessionToken', result.session.access_token)
      localStorage.setItem('userEmail', result.user.email)
      localStorage.setItem('userId', result.user.id)
      const userProfile = await fetch('/api/get-user-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: result.user.id })
      }).then(r => r.json())
      localStorage.setItem('fromEmail', userProfile.newemail)
      showCompose()
    } else {
      alert('Login failed: ' + (result.error || 'Unknown error'))
    }
  } catch (error) {
    alert('Error: ' + error.message)
  }
})

document.getElementById('SendButton').addEventListener('click', async () => {
  const to = document.getElementById('ToHeader').value
  const subject = document.getElementById('SubjectHeader').value
  const message = document.getElementById('MessageBody').value
  const fromEmail = localStorage.getItem('fromEmail')
  if (!to || !subject || !message) {
    alert('Please fill in all fields!')
    return
  }
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, message, fromEmail })
    })
    const result = await response.json()
    if (result.success) {
      alert('Email sent! ✓')
      document.getElementById('ToHeader').value = ''
      document.getElementById('SubjectHeader').value = ''
      document.getElementById('MessageBody').value = ''
    } else {
      alert('Error: ' + result.error)
    }
  } catch (error) {
    alert('Error sending email: ' + error.message)
  }
})

document.getElementById('SignupButton').addEventListener('click', async () => {
  const email = document.getElementById('SignupEmailHeader').value
  const password = document.getElementById('SignupPasswordHeader').value
  const confirm = document.getElementById('SignupPasswordConfirm').value
  const newEmail = document.getElementById('SignupNewEmailHeader').value  // New field!

  if (!email || !password || !confirm || !newEmail) {
    alert('Please fill in all fields!')
    return
  }

  if (password !== confirm) {
    alert('Passwords do not match!')
    return
  }

  if (!newEmail.endsWith('@bloxxer.dev')) {
    alert('New email must end with @bloxxer.dev!')
    return
  }

  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, newEmail })
    })

    const result = await response.json()

    if (result.success) {
      alert('Account created! Check your email to verify, then log in.')
    } else {
      alert('Signup failed: ' + (result.error || 'Unknown error'))
    }
  } catch (error) {
    alert('Error: ' + error.message)
  }
})