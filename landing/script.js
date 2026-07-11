document.documentElement.classList.add('js')

const header = document.querySelector('[data-site-header]')
const menu = document.querySelector('[data-site-menu]')
const menuToggle = document.querySelector('[data-menu-toggle]')

function setMenu(open) {
  if (!menu || !menuToggle) return
  menu.classList.toggle('is-open', open)
  menuToggle.setAttribute('aria-expanded', String(open))
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation')
  document.body.classList.toggle('menu-open', open)
}

menuToggle?.addEventListener('click', () => {
  setMenu(menuToggle.getAttribute('aria-expanded') !== 'true')
})

menu?.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false)
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenu(false)
})

window.addEventListener('resize', () => {
  if (window.innerWidth > 820) setMenu(false)
})

function updateHeader() {
  header?.classList.toggle('is-scrolled', window.scrollY > 12)
}

updateHeader()
window.addEventListener('scroll', updateHeader, { passive: true })

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear())
})

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const revealItems = document.querySelectorAll('.reveal')

if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'))
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  )

  revealItems.forEach((item) => revealObserver.observe(item))
}
