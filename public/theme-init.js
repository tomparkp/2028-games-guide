;(function () {
  try {
    var stored = window.localStorage.getItem('28games_session_guide_theme')
    if (stored === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else if (stored === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  } catch {}
})()
