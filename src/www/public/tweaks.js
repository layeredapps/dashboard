let activeMenu
function toggleMenu (e) {
  if (activeMenu) {
    activeMenu.classList.remove('menu-group-active')
    activeMenu.classList.remove('spillage-active')
    activeMenu = null
  }
  let container = e.target
  while (container && !container.classList.contains('menu-group')) {
    container = container.parentNode
  }
  if (container.classList.contains('menu-group-active')) {
    container.classList.remove('menu-group-active')
    activeMenu = null
  } else {
    container.classList.add('menu-group-active')
    activeMenu = container
  }
}

function toggleSpillage (e) {
  if (activeMenu) {
    activeMenu.classList.remove('menu-group-active')
    activeMenu.classList.remove('spillage-active')
    activeMenu = null
  }
  let container = e.target
  while (container && !container.classList.contains('spillage')) {
    container = container.parentNode
  }
  if (container.classList.contains('spillage-active')) {
    container.classList.remove('spillage-active')
    activeMenu = null
  } else {
    container.classList.add('spillage-active')
    activeMenu = container
  }
}

window.addEventListener('load', () => {
  // disable forms submitting twice for a moment
  const forms = document.getElementsByTagName('form')
  if (forms && forms.length) {
    for (const form of forms) {
      form.onsubmit = () => {
        if (form.getAttribute('submitted') === true) {
          return
        }
        form.setAttribute('submitted', true)
        setTimeout(() => {
          form.setAttribute('submitted', undefined)
        }, 2500)
      }
    }
  }
  // add manual activation for menus
  const administratorMenuContainer = document.querySelector('#administrator-menu-container')
  if (administratorMenuContainer) {
    administratorMenuContainer.addEventListener('click', toggleMenu)
    administratorMenuContainer.addEventListener('hover', toggleMenu)
  }
  const accountMenuContainer = document.querySelector('#account-menu-container')
  if (accountMenuContainer) {
    accountMenuContainer.addEventListener('click', toggleMenu)
    accountMenuContainer.addEventListener('hover', toggleMenu)
  }
  // move off-screen links to spillage menu
  const spillageMenuContainer = document.querySelector('#spillage-menu-container')
  if (spillageMenuContainer) {
    spillageMenuContainer.addEventListener('click', toggleSpillage)
    spillageMenuContainer.addEventListener('hover', toggleSpillage)
    const navigation = document.querySelector('#navigation')
    if (!navigation) {
      return
    }
    const navigationLinks = Array.from(navigation.getElementsByClassName('navigation-link'))
    const spillageLinks = Array.from(spillageMenuContainer.getElementsByClassName('spillage-link'))
    if (!navigationLinks.length) {
      return
    }
    const totalWidth = navigation.lastChild.offsetLeft + navigation.lastChild.offsetWidth
    function toggleSpillageVisibility () {
      const screenWidth = window.innerWidth || document.documentElement.clientWidth
      if (totalWidth < screenWidth) {
        if (spillageMenuContainer.style.display !== 'none') {
          spillageMenuContainer.style.display = 'none'
        }
      } else {
        if (spillageMenuContainer.style.display !== 'block') {
          spillageMenuContainer.style.display = 'block'
          const threshold = (window.innerWidth || document.documentElement.clientWidth) - spillageMenuContainer.offsetWidth
          for (const i in navigationLinks) {
            const navigationLink = navigationLinks[i]
            const spillageLink = spillageLinks[i]
            const bounds = navigationLink.getBoundingClientRect()
            if (bounds.right <= threshold) {
              spillageLink.style.display = 'none'
              navigationLink.style.visibility = ''
            } else {
              spillageLink.style.display = 'block'
              navigationLink.style.visibility = 'hidden'
            }
          }
        }
      }
    }
    toggleSpillageVisibility()
    window.addEventListener('resize', toggleSpillageVisibility)
    window.addEventListener('orientationchange', toggleSpillageVisibility)
  }
})

document.addEventListener('mouseup', (event) => {
  let element = event.target
  while (element) {
    if (element === activeMenu) {
      return
    }
    element = element.parentNode
  }
  if (activeMenu) {
    activeMenu.classList.remove('menu-group-active')
    activeMenu.classList.remove('spillage-active')
    activeMenu = null
  }
})
