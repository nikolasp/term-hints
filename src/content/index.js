import tippy from 'tippy.js/dist/tippy.all'
import findAndReplaceDOMText from 'findAndReplaceDOMText'

let instances = {}

const transformBody = (bodyHTML, terms) => {
  terms
    .map((value) => value['@surfaceForm'] || '')
    .filter((value, index, self) => self.indexOf(value) === index)
    .forEach(term => {
      if (term === '') return
      let el = document.createElement('span')
      let imageSrc = chrome.extension.getURL('loader.gif')
      el.appendChild(document.createTextNode(term))
      el.className = 'tippy'
      el.style.background = 'yellow'
      el.style.cursor = 'pointer'
      el.style.color = 'black'
      el.style.textShadow = 'none'
      el.setAttribute(
        'title',
        `Loading Description <br/> <img style='width:30px' src='${imageSrc}' />`
      )

      findAndReplaceDOMText(bodyHTML, {
        find: term,
        replace: () => {
          let clonedEl = el.cloneNode(true)
          clonedEl.onclick = (event) => {
            event.stopPropagation()
            event.preventDefault()
            window.open(`https://en.wikipedia.org/wiki/${term}`, '_blank')
          }
          return clonedEl
        }
      })
    })
}

const onMessage = (message, sender, sendResponse) => {
  if (!message) return

  if (message.action === 'READ_FROM_PAGE' && !document.location.ancestorOrigins.length) {
    let content = document.body.innerText.replace(/(\n|\t|\r|\rn|#)/gmi, ' ')
    return sendResponse(content)
  }

  if (message.action === 'SET_TERM_INFO') {
    let instance = instances[message.data.termId]
    if (!instance) return
    let title = message.data.type === 'disambiguation'
      ? 'Click to visit a page providing links to articles with similar titles'
      : message.data.extract
    instance.title = title
    instance.reference.setAttribute('title', title)
    instance.reference.setAttribute('loaded-description', true)
    return
  }

  if (message.action === 'WRITE_TO_PAGE') {
    transformBody(document.body, message.data)
    new tippy(document.body.querySelectorAll('.tippy'), {  // eslint-disable-line
      delay: 100,
      arrow: true,
      arrowType: 'round',
      size: 'large',
      duration: 500,
      animation: 'scale',
      dynamicTitle: true,
      onShow (instance) {
        if (instance.reference.getAttribute('loaded-description') === 'true') {
          return
        }
        let term = instance.reference.textContent
        let termId = Date.now() / 1000 | 0
        instances = {}
        instances[termId] = instance
        instance.reference.setAttribute('term-id', termId)
        chrome.runtime.sendMessage({
          action: 'GET_TERM_INFO',
          data: {
            term,
            termId
          }
        })
      }
    })
  }
}

chrome.runtime.onMessage.addListener(onMessage)
