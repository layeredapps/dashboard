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
  const spillageMenuContainer = document.querySelector('#spillage-menu-container')
  if (spillageMenuContainer) {
    spillageMenuContainer.addEventListener('click', toggleSpillage)
    spillageMenuContainer.addEventListener('hover', toggleSpillage)
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
