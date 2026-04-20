/**
 * Generator Bridge SDK v1.1.1
 *
 * 统一管理生成器 HTML 与父页面之间的 postMessage 通讯
 * 生成器只需引入此文件 + 注册 window.__GENERATOR_BRIDGE__ 即可获得：
 *   - 导出文件（下载 / 打开到 Studio）
 *   - 云端保存与恢复
 *   - 参数变更自动上报
 *
 * 接口约定：
 *   window.__GENERATOR_BRIDGE__ = {
 *     name: string,
 *     getSnapshot: () => object,
 *     // 新接口（推荐）：返回结构化导出数据，支持任意格式
 *     getExportData?: (action: string) => ExportData | Promise<ExportData | null> | null,
 *     // 旧接口（兼容）：仅支持 canvas → PNG
 *     getExportCanvas?: (action: string) => HTMLCanvasElement | Promise<HTMLCanvasElement | null> | null,
 *     applySnapshot: (snapshot: object, originImageUrl: string) => void,
 *     getOriginImageUrl?: () => string,
 *     // 模板接口（可选）
 *     getTemplateFieldOptions?: () => TemplateFieldOption[] | Promise<TemplateFieldOption[]>,
 *     buildTemplate?: (params?: object) => GeneratorTemplatePayload | GeneratorTemplate | Promise<GeneratorTemplatePayload | GeneratorTemplate>,
 *     applyTemplate?: (template: object, options?: object) => void | Promise<void>,
 *     getTemplateData?: () => GeneratorTemplatePayload | GeneratorTemplate | Promise<GeneratorTemplatePayload | GeneratorTemplate>,
 *   }
 *
 *   ExportData = {
 *     dataUrl: string,   // data URL（base64 编码）
 *     mimeType: string,  // 如 'image/png' | 'image/svg+xml' | 'image/jpeg'
 *     ext: string,       // 文件扩展名，如 'png' | 'svg' | 'jpg'
 *   }
 */
;(function () {
  'use strict'

  var SYNC_DEBOUNCE_MS = 250
  var POLL_INTERVAL_MS = 100
  var POLL_MAX_RETRIES = 150

  var initialized = false
  var syncTimer = null

  // ---- 工具函数 ----

  function post(type, data) {
    try {
      console.log('postMessage', type, data)
      window.parent.postMessage({ type: type, data: data }, '*')
    } catch (e) {
      console.warn('[GeneratorBridge] postMessage failed:', e)
    }
  }

  // ---- 核心初始化 ----

  function initBridge(bridge) {
    if (initialized) return
    initialized = true

    var bridgeName = bridge.name || 'unknown'

    /**
     * 构建上报数据包（异步，支持 getExportData 返回 Promise）
     * 结构需与父页面 Header.vue 的 saveGeneratorData 兼容
     */
    function buildPayload() {
      var snapshot = {}
      try {
        snapshot = bridge.getSnapshot() || {}
      } catch (e) {
        console.warn('[GeneratorBridge] getSnapshot() error:', e)
      }

      var originImageUrl = ''
      try {
        if (typeof bridge.getOriginImageUrl === 'function') {
          originImageUrl = bridge.getOriginImageUrl() || ''
        }
      } catch (_) {
        /* ignore */
      }

      var snapshotInfo = Object.assign(
        { version: '1.0.0', generatorName: bridgeName },
        snapshot,
      )

      // 获取封面（兼容同步/异步两种情况）
      var coverPromise
      try {
        if (typeof bridge.getExportCanvas === 'function') {
          // 旧接口：同步返回 canvas
          var canvas = bridge.getExportCanvas('cover')
          if (canvas && typeof canvas.toDataURL === 'function') {
            coverPromise = Promise.resolve(canvas.toDataURL('image/png'))
          } else {
            coverPromise = Promise.resolve('')
          }
        } else if (typeof bridge.getExportData === 'function') {
          // 新接口：支持同步或 Promise 返回
          coverPromise = Promise.resolve(bridge.getExportData('cover')).then(function (result) {
            if (result && typeof result === 'object' && result.dataUrl) {
              return result.dataUrl
            }
            return ''
          })
        } else {
          coverPromise = Promise.resolve('')
        }
      } catch (e) {
        console.warn('[GeneratorBridge] cover export failed:', e.message)
        coverPromise = Promise.resolve('')
      }

      return coverPromise.then(function (cover) {
        return {
          cover: cover,
          originImageUrl: originImageUrl,
          info: snapshotInfo,
        }
      })
    }

    function postTemplateError(action, message) {
      post('generator_toTemplateError', {
        action: action,
        message: message,
      })
    }

    function normalizeTemplatePayload(result) {
      if (!result) {
        return Promise.reject(new Error('Template payload is empty'))
      }

      if (result.template && typeof result.template === 'object') {
        return Promise.resolve(result)
      }

      if (result.type === 'generator-template') {
        return buildPayload().then(function (payload) {
          return {
            template: result,
            info: payload.info || {},
            cover: payload.cover || '',
            originImageUrl: payload.originImageUrl || '',
          }
        })
      }

      return Promise.reject(new Error('Invalid template payload format'))
    }

    function makeTemplatePayloadSerializable(payload) {
      try {
        return JSON.parse(JSON.stringify(payload))
      } catch (error) {
        return null
      }
    }

    /**
     * 防抖自动上报
     * 生成器在参数变化时调用 window.__GENERATOR_BRIDGE__._sync()
     */
    bridge._sync = function () {
      if (syncTimer) clearTimeout(syncTimer)
      syncTimer = setTimeout(function () {
        buildPayload().then(function (payload) {
          post('generator_toGeneratorData', payload)
        })
      }, SYNC_DEBOUNCE_MS)
    }

    // ---- 消息监听 ----

    function handleGetFile(data) {
      var action = data && data.action
      try {
        // 优先使用新接口 getExportData，兼容旧接口 getExportCanvas
        var exportFn = typeof bridge.getExportData === 'function'
          ? function () { return bridge.getExportData(action) }
          : function () { return bridge.getExportCanvas(action) }

        Promise.resolve(exportFn())
          .then(function (output) {
            if (!output) {
              post('generator_toFileError', {
                action: action,
                message: 'No export data available',
              })
              return
            }

            // 旧接口返回 canvas 对象，转为 PNG
            if (typeof output.toDataURL === 'function') {
              try {
                var base64 = output.toDataURL('image/png')
                post('generator_toFile', {
                  action: action,
                  base64: base64,
                  mimeType: 'image/png',
                  ext: 'png',
                })
              } catch (e) {
                post('generator_toFileError', {
                  action: action,
                  message: e.message || 'toDataURL failed',
                })
              }
              return
            }

            // 新接口返回结构化对象 { dataUrl, mimeType, ext }
            if (output.dataUrl) {
              post('generator_toFile', {
                action: action,
                base64: output.dataUrl,
                mimeType: output.mimeType || 'image/png',
                ext: output.ext || 'png',
              })
              return
            }

            post('generator_toFileError', {
              action: action,
              message: 'Invalid export data format',
            })
          })
          .catch(function (err) {
            post('generator_toFileError', {
              action: action,
              message: err.message || 'Export failed',
            })
          })
      } catch (e) {
        post('generator_toFileError', {
          action: action,
          message: e.message || 'getExportData error',
        })
      }
    }

    function handleGetGeneratorData() {
      buildPayload().then(function (payload) {
        post('generator_toGeneratorData', payload)
      })
    }

    function handleSetGeneratorData(data) {
      var cloudInfo = (data && data.data) || data || {}
      var originImageUrl = ''

      // originImageUrl 可能在顶层或 info 内，兼容两种数据结构
      if (typeof cloudInfo.originImageUrl === 'string') {
        originImageUrl = cloudInfo.originImageUrl
      } else if (cloudInfo.info && typeof cloudInfo.info.originImageUrl === 'string') {
        originImageUrl = cloudInfo.info.originImageUrl
      }

      try {
        bridge.applySnapshot(cloudInfo, originImageUrl)
      } catch (e) {
        console.warn('[GeneratorBridge] applySnapshot error:', e)
      }
    }

    function handleGetTemplateFieldOptions() {
      if (typeof bridge.getTemplateFieldOptions !== 'function') {
        postTemplateError('getTemplateFieldOptions', 'Template field options are not supported')
        return
      }

      Promise.resolve(bridge.getTemplateFieldOptions())
        .then(function (fields) {
          post('generator_toTemplateFieldOptions', {
            fields: Array.isArray(fields) ? fields : [],
          })
        })
        .catch(function (err) {
          postTemplateError('getTemplateFieldOptions', err.message || 'Get template field options failed')
        })
    }

    function handlePublishTemplate(data) {
      if (typeof bridge.buildTemplate !== 'function') {
        postTemplateError('publishTemplate', 'Template publishing is not supported')
        return
      }

      Promise.resolve(bridge.buildTemplate(data || {}))
        .then(normalizeTemplatePayload)
        .then(function (payload) {
          var safePayload = makeTemplatePayloadSerializable(payload)
          if (!safePayload) {
            throw new Error('Template payload is not serializable')
          }
          post('generator_toPublishTemplate', safePayload)
        })
        .catch(function (err) {
          postTemplateError('publishTemplate', err.message || 'Publish template failed')
        })
    }

    function handleLoadTemplateData(data) {
      if (typeof bridge.applyTemplate !== 'function') {
        postTemplateError('loadTemplateData', 'Template loading is not supported')
        return
      }

      var template = data && data.template ? data.template : data
      Promise.resolve(bridge.applyTemplate(template, data || {}))
        .then(function () {
          post('generator_toTemplateLoaded', {
            template: template || null,
          })
        })
        .catch(function (err) {
          postTemplateError('loadTemplateData', err.message || 'Load template failed')
        })
    }

    function handleGetTemplateData() {
      var getTemplateDataFn = typeof bridge.getTemplateData === 'function'
        ? function () { return bridge.getTemplateData() }
        : (typeof bridge.buildTemplate === 'function'
          ? function () { return bridge.buildTemplate({}) }
          : null)

      if (!getTemplateDataFn) {
        postTemplateError('getTemplateData', 'Template data is not supported')
        return
      }

      Promise.resolve(getTemplateDataFn())
        .then(normalizeTemplatePayload)
        .then(function (payload) {
          var safePayload = makeTemplatePayloadSerializable(payload)
          if (!safePayload) {
            throw new Error('Template payload is not serializable')
          }
          post('generator_toTemplateData', safePayload)
        })
        .catch(function (err) {
          postTemplateError('getTemplateData', err.message || 'Get template data failed')
        })
    }

    var messageHandlers = {
      generator_getFile: handleGetFile,
      generator_getGeneratorData: handleGetGeneratorData,
      generator_setGeneratorData: handleSetGeneratorData,
      generator_getTemplateFieldOptions: handleGetTemplateFieldOptions,
      generator_publishTemplate: handlePublishTemplate,
      generator_loadTemplateData: handleLoadTemplateData,
      generator_getTemplateData: handleGetTemplateData,
    }

    function onMessage(event) {
      var msg = event.data
      if (!msg || typeof msg !== 'object') return

      var type = msg.type
      var data = msg.data
      var handler = messageHandlers[type]

      if (!handler) return
      handler(data)
    }

    window.addEventListener('message', onMessage)

    // 页面加载完成通知（仅发送一次）
    var flagKey = '__bridgePageLoadedSent__' + bridgeName
    if (!window[flagKey]) {
      window[flagKey] = true
      post('generator_pageLoaded')
    }

    console.log(
      '[GeneratorBridge] "' + bridgeName + '" connected (v1.1.1)',
    )
  }

  // ---- 等待 bridge 注册 ----

  function pollForBridge(retry) {
    if (window.__GENERATOR_BRIDGE__) {
      initBridge(window.__GENERATOR_BRIDGE__)
    } else if (retry < POLL_MAX_RETRIES) {
      setTimeout(function () {
        pollForBridge(retry + 1)
      }, POLL_INTERVAL_MS)
    } else {
      console.error(
        '[GeneratorBridge] window.__GENERATOR_BRIDGE__ not registered within ' +
          (POLL_MAX_RETRIES * POLL_INTERVAL_MS) / 1000 +
          's',
      )
    }
  }

  // 支持主动注册（解决加载顺序问题）
  window.__registerGeneratorBridge__ = function (bridge) {
    window.__GENERATOR_BRIDGE__ = bridge
    initBridge(bridge)
  }

  // 轮询兜底
  pollForBridge(0)
})()
