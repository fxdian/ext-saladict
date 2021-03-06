import { message, storage, openURL, __META__ } from '../browser-api'

beforeEach(() => {
  browser.flush()
  delete window.pageId
  delete window.faviconURL
  delete window.pageTitle
  delete window.pageURL
})

describe('Browser API Wapper', () => {
  describe('Storage', () => {
    ['sync', 'local'].forEach(area => {
      it(`storage.${area}.clear`, () => {
        storage[area].clear()
        expect(browser.storage[area].clear.calledOnce).toBeTruthy()
      })
      it(`storage.${area}.remove`, () => {
        const key = `key-${area}`
        storage[area].remove(key)
        expect(browser.storage[area].remove.calledWith(key)).toBeTruthy()
      })
      it(`storage.${area}.get`, () => {
        const key = `key-${area}`
        storage[area].get(key)
        expect(browser.storage[area].get.calledWith(key)).toBeTruthy()
      })
      it(`storage.${area}.set`, () => {
        const key = { key: area }
        storage[area].set(key)
        expect(browser.storage[area].set.calledWith(key)).toBeTruthy()
      })
      it(`storage.${area}.addListener`, () => {
        const cb = () => {}
        storage[area].addListener(cb)
        expect(browser.storage.onChanged.addListener.calledOnce).toBeTruthy()
        expect(typeof __META__.storageListeners.get(cb).get(area)).toBe('function')
      })
      it(`storage.${area}.removeListener`, () => {
        const cb = jest.fn()
        storage[area].addListener(cb)
        storage[area].removeListener(cb)
        expect(browser.storage.onChanged.removeListener.calledOnce).toBeTruthy()
        expect(__META__.storageListeners.get(cb)).toBeUndefined()
        expect(cb).toHaveBeenCalledTimes(0)
      })
    })

    it(`storage.clear`, () => {
      storage.clear()
      expect(browser.storage.sync.clear.calledOnce).toBeTruthy()
      expect(browser.storage.local.clear.calledOnce).toBeTruthy()
    })
    it(`storage.addListener`, () => {
      const cb = jest.fn()
      storage.addListener(cb)
      expect(browser.storage.onChanged.addListener.calledOnce).toBeTruthy()
      expect(typeof __META__.storageListeners.get(cb).get('all')).toBe('function')
      expect(cb).toHaveBeenCalledTimes(0)
    })
    it(`storage.removeListener`, () => {
      const cb = jest.fn()
      storage.addListener(cb)
      storage.removeListener(cb)
      expect(browser.storage.onChanged.removeListener.calledOnce).toBeTruthy()
      expect(__META__.storageListeners.get(cb)).toBeUndefined()
      expect(cb).toHaveBeenCalledTimes(0)
    })
  })

  describe('Message', () => {
    it('message.send', () => {
      const tabId = 1
      const msg = {}

      message.send(msg)
      expect(browser.runtime.sendMessage.calledWith(msg)).toBeTruthy()
      expect(browser.tabs.sendMessage.notCalled).toBeTruthy()

      browser.runtime.sendMessage.flush()
      browser.tabs.sendMessage.flush()

      message.send(tabId, msg)
      expect(browser.tabs.sendMessage.calledWith(tabId, msg)).toBeTruthy()
      expect(browser.runtime.sendMessage.notCalled).toBeTruthy()
    })
    it('message.addListener', () => {
      const cb1 = jest.fn()
      const cb2 = jest.fn()
      let cb1Call = 0
      let cb2Call = 0
      message.addListener(cb1)
      message.addListener('MSG_1', cb2)
      expect(browser.runtime.onMessage.addListener.calledTwice).toBeTruthy()
      expect(cb1).toHaveBeenCalledTimes(cb1Call)
      expect(cb2).toHaveBeenCalledTimes(cb2Call)
      expect(__META__.messageListeners.get(cb1)).toBeTruthy()
      expect(__META__.messageListeners.get(cb2)).toBeTruthy()

      browser.runtime.onMessage.dispatch({ type: 'MSG_2' })
      expect(cb1).toHaveBeenCalledTimes(++cb1Call)
      expect(cb2).toHaveBeenCalledTimes(cb2Call)

      browser.runtime.onMessage.dispatch({ type: 'MSG_1' })
      expect(cb1).toHaveBeenCalledTimes(++cb1Call)
      expect(cb2).toHaveBeenCalledTimes(++cb2Call)
    })
    it('message.removeListener', () => {
      const cb1 = jest.fn()
      const cb2 = jest.fn()
      let cb1Call = 0
      let cb2Call = 0
      message.addListener('MSG_1', cb1)
      message.addListener('MSG_2', cb2)
      browser.runtime.onMessage.dispatch({ type: 'MSG_1' })
      expect(cb1).toHaveBeenCalledTimes(++cb1Call)
      expect(cb2).toHaveBeenCalledTimes(cb2Call)

      message.removeListener('MSG_x', cb1)
      message.removeListener(cb2)
      expect(browser.runtime.onMessage.removeListener.calledTwice).toBeTruthy()
      expect(__META__.messageListeners.get(cb1)).toBeTruthy()
      expect(__META__.messageListeners.get(cb2)).toBeUndefined()

      browser.runtime.onMessage.dispatch({ type: 'MSG_1' })
      browser.runtime.onMessage.dispatch({ type: 'MSG_2' })
      expect(cb1).toHaveBeenCalledTimes(++cb1Call)
      expect(cb2).toHaveBeenCalledTimes(cb2Call)

      message.removeListener('MSG_1', cb1)
      expect(__META__.messageListeners.get(cb1)).toBeUndefined()
      browser.runtime.onMessage.dispatch({ type: 'MSG_1' })
      expect(cb1).toHaveBeenCalledTimes(cb1Call)
    })

    it('message.self.initClient', () => {
      browser.runtime.sendMessage
        .withArgs({ type: '__PAGE_INFO__' })
        .returns(Promise.resolve({
          pageId: 'pageId',
          faviconURL: 'faviconURL',
          pageTitle: 'pageTitle',
          pageURL: 'pageURL',
        }))
      return message.self.initClient()
        .then(() => {
          expect(browser.runtime.sendMessage.calledWith({ type: '__PAGE_INFO__' })).toBeTruthy()
          expect(window.pageId).toBe('pageId')
          expect(window.faviconURL).toBe('faviconURL')
          expect(window.pageTitle).toBe('pageTitle')
          expect(window.pageURL).toBe('pageURL')
        })
    })
    describe('message.self.initServer', () => {
      const tab = {
        id: 1,
        favIconUrl: 'https://example.com/favIconUrl',
        url: 'https://example.com/url',
        title: 'title',
      }

      it('From tab', () => {
        message.self.initServer()
        expect(browser.runtime.onMessage.addListener.calledOnce).toBeTruthy()

        const sendResponse = jest.fn()
        browser.runtime.onMessage.dispatch({ type: '__PAGE_INFO__' }, { tab }, sendResponse)
        expect(sendResponse).toBeCalledWith(({
          pageId: tab.id,
          faviconURL: tab.favIconUrl,
          pageTitle: tab.title,
          pageURL: tab.url,
        }))
      })

      it('From browser action page', () => {
        message.self.initServer()
        expect(browser.runtime.onMessage.addListener.calledOnce).toBeTruthy()

        const sendResponse = jest.fn()
        browser.runtime.onMessage.dispatch({ type: '__PAGE_INFO__' }, {}, sendResponse)
        expect(sendResponse).toBeCalledWith(
          expect.objectContaining({
            pageId: 'popup',
          })
        )
      })

      it('Self page message transmission', () => {
        message.self.initServer()
        expect(browser.runtime.onMessage.addListener.calledOnce).toBeTruthy()

        browser.runtime.onMessage.dispatch({ type: '_&_MSG_1_&_', __pageId__: 1 }, {})
        expect(browser.runtime.sendMessage.calledWith({ type: 'MSG_1', __pageId__: 1 })).toBeTruthy()

        browser.runtime.onMessage.dispatch({ type: '_&_MSG_1_&_', __pageId__: 1 }, { tab })
        expect(browser.tabs.sendMessage.calledWith(tab.id, { type: 'MSG_1', __pageId__: 1 })).toBeTruthy()
      })
    })
    it('message.self.send', () => {
      window.pageId = 1
      message.self.send({
        type: 'MSG_1',
        prop: 'value',
      })
      expect(browser.runtime.sendMessage.calledWith({
        type: '_&_MSG_1_&_',
        __pageId__: window.pageId,
        prop: 'value',
      })).toBeTruthy()
    })
    it('message.self.addListener', () => {
      window.pageId = 1
      const cb1 = jest.fn()
      const cb2 = jest.fn()
      let cb1Call = 0
      let cb2Call = 0
      message.self.addListener(cb1)
      message.addListener(cb2)
      expect(browser.runtime.onMessage.addListener.calledTwice).toBeTruthy()
      expect(cb1).toHaveBeenCalledTimes(cb1Call)
      expect(cb2).toHaveBeenCalledTimes(cb2Call)
      expect(__META__.messageSelfListeners.get(cb1)).toBeTruthy()
      expect(__META__.messageListeners.get(cb2)).toBeTruthy()

      browser.runtime.onMessage.dispatch({ type: 'MSG_1', __pageId__: window.pageId })
      expect(cb1).toHaveBeenCalledTimes(++cb1Call)
      expect(cb2).toHaveBeenCalledTimes(cb2Call)

      browser.runtime.onMessage.dispatch({ type: 'MSG_1' })
      expect(cb1).toHaveBeenCalledTimes(cb1Call)
      expect(cb2).toHaveBeenCalledTimes(++cb2Call)

      browser.runtime.onMessage.dispatch({ type: 'MSG_1', __pageId__: window.pageId + 2 })
      expect(cb1).toHaveBeenCalledTimes(cb1Call)
      expect(cb2).toHaveBeenCalledTimes(cb2Call)
    })
    it('message.self.removeListener', () => {
      window.pageId = 1
      const cb1 = jest.fn()
      let cb1Call = 0
      message.self.addListener(cb1)
      browser.runtime.onMessage.dispatch({ __pageId__: window.pageId })
      expect(cb1).toHaveBeenCalledTimes(++cb1Call)

      message.self.removeListener(cb1)
      expect(browser.runtime.onMessage.removeListener.calledOnce).toBeTruthy()
      expect(__META__.messageListeners.get(cb1)).toBeUndefined()

      browser.runtime.onMessage.dispatch({ __pageId__: window.pageId })
      expect(cb1).toHaveBeenCalledTimes(cb1Call)
    })
  })
  describe('openURL', () => {
    const url = 'https://example.com'

    it('Existing tab', () => {
      browser.tabs.query.returns(Promise.resolve(
        [{
          index: 1
        }]
      ))
      return openURL(url)
        .then(() => {
          expect(browser.tabs.query.calledWith({ url })).toBeTruthy()
          expect(browser.tabs.highlight.calledWith({ tabs: 1 })).toBeTruthy()
          expect(browser.tabs.create.notCalled).toBeTruthy()
        })
    })
    it('New tab', () => {
      browser.tabs.query.returns(Promise.resolve([]))
      return openURL(url)
        .then(() => {
          expect(browser.tabs.query.calledWith({ url })).toBeTruthy()
          expect(browser.tabs.highlight.notCalled).toBeTruthy()
          expect(browser.tabs.create.calledWith({ url })).toBeTruthy()
        })
    })
  })
})
