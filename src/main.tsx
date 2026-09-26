import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'
import './styles/animations.css'
import './styles/print.css'

// Printing must not depend on a UA stylesheet detail: some engines hide the
// body of a closed <details> with `content-visibility: hidden`, which author
// CSS can override but which is easy to regress. print.css does both, and this
// flips `open` as well so the case studies are on paper in every browser.
const openCollapsedDetails = () => {
  document.querySelectorAll('details').forEach((details) => {
    details.open = true
  })
}

window.addEventListener('beforeprint', openCollapsedDetails)
window.matchMedia('print').addEventListener('change', (event) => {
  if (event.matches) openCollapsedDetails()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
