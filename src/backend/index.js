import { format } from 'util'

const API_ENDPOINTS = {
  ANOTATIONS: 'https://model.dbpedia-spotlight.org/en/annotate?confidence=%s&text=%s',
  WIKI_INFO: 'https://en.wikipedia.org/api/rest_v1/page/summary/%s'
}
const ANOTATIONS_CONFIDENCE = 0.3

const fetchDefinitions = (content) => {
  return new Promise((resolve, reject) => {
    fetch(format(API_ENDPOINTS.ANOTATIONS, ANOTATIONS_CONFIDENCE, content), {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Accept': 'application/json'
      }
    }).then(async (response) => {
      let data = await response.json()
      resolve(data)
    }).catch((err) => reject(err))
  })
}

const fetchMultipleDefinitions = (content) => {
  const numberOfWords = 100
  let words = (content || '').split(' ')

  return new Promise(async (resolve) => {
    let numberOfSubstrings = Math.ceil(words.length / numberOfWords)
    let resources = []
    for (let index = 1; index <= numberOfSubstrings; index++) {
      let terms = words.filter(
        (val, key) => key >= (index - 1) * numberOfWords && key < index * numberOfWords).join(' ')
      if (terms === '') continue
      let response = await fetchDefinitions(terms)
      resources = resources.concat(response['Resources'])
    }
    resolve(resources)
  })
}

const fetchTermInfo = (term) => {
  return fetch(format(API_ENDPOINTS.WIKI_INFO, term), {
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  })
}

chrome.browserAction.onClicked.addListener((tab) => {
  if (!tab) return
  chrome.browserAction.setBadgeBackgroundColor({
    color: '#a4a4a4',
    tabId: tab.id
  })
  chrome.browserAction.disable(tab.id)
  let second = 0
  let intervalId = setInterval(() => {
    chrome.browserAction.setBadgeText(
      {text: `${second}`, tabId: tab.id},
      () => {
        if (chrome.runtime.lastError &&
          chrome.runtime.lastError.message.indexOf('tab') > -1) {
          clearInterval(intervalId)
        }
      }
    )
    second += 1
  }, 1000)
  chrome.tabs.sendMessage(tab.id, {
    action: 'READ_FROM_PAGE'
  }, null, (content) => {
    fetchMultipleDefinitions(content).then((resources) => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'WRITE_TO_PAGE',
        data: resources
      }, () => {
        if (chrome.runtime.lastError &&
          chrome.runtime.lastError.message.indexOf('tab') > -1) {
          return clearInterval(intervalId)
        }
        clearInterval(intervalId)
        chrome.browserAction.setBadgeText({text: '✔️', tabId: tab.id})
        chrome.browserAction.enable(tab.id)
        setTimeout(() => chrome.browserAction.setBadgeText({text: '', tabId: tab.id}), 2000)
      })
    })
  })
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'GET_TERM_INFO') {
    fetchTermInfo(message.data.term).then(async (response) => {
      let data = await response.json()
      chrome.tabs.sendMessage(sender.tab.id, {
        action: 'SET_TERM_INFO',
        data: { ...data, ...message.data }
      })
    })
  }
})
