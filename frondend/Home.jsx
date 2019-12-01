/* global MutationObserver, Image */

import React from 'react'
import { Upload, Tabs, Empty, Icon } from 'antd'
import CopyInput from './CopyInput'
import { FILE_MAX_SIZE, FILE_TYPE_ALLOWED } from '../shared/constants'

import './home.less'

/**
 * @description 负责处理用户的 ctrl + x 粘贴图片的操作
 */
class PasteImage {
  /**
   * 在获取到用户 paste 的图片数据时的回调函数
   * @param {(imageBlobData: Blob) => void} callback
   */
  constructor (callback) {
    this._callBack = callback
    /** @private {boolean} 用户是否正在按下 ctrl 键 */
    this._ctrlPressed = false
    /** @private {boolean} 用户是否正在按下 command 键, MacOS 系统下 */
    this._commandPressed = false
    /** @private {HTMLDivElement} 捕获用户粘贴的图片的容器 */
    this._pasteCatcher = document.createElement('div')
    /** @private {boolean} 是否支持 Native paste 事件 */
    this._pasteEventSupport = false
    /** @private {HTMLDivElement} 捕获用户粘贴的图片的容器的 ID */
    this._pasteCatcherId = `paste-image-${Math.random()}`
    this._pasteCatcher.setAttribute('id', this._pasteCatcherId)
    this._pasteCatcher.setAttribute('contenteditable', '')
    this._pasteCatcher.style.cssText = 'opacity:0;position:fixed;top:0px;left:0px;width:10px;margin-left:-20px;'
    /**
     * 处理页面按键按下
     * @private
     * @type {(event: KeyboardEvent) => void}
     */
    this._handleOnKeyDown = this._handleOnKeyDown.bind(this)
    /**
     * 处理页面按键释放
     * @private
     * @type {(event: KeyboardEvent) => void}
     */
    this._handleOnKeyUp = this._handleOnKeyUp.bind(this)
    /**
     * 处理页面的 paste 事件
     * @private
     * @type {(event: ClipboardEvent) => void}
     */
    this._handleOnPaste = this._handleOnPaste.bind(this)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (this._pasteEventSupport || this._ctrlPressed === false || mutation.type !== 'childList') {
          return
        }

        if (mutation.addedNodes.length === 1) {
          if (mutation.addedNodes[0].src !== undefined) {
            this._pasteCreateImage(mutation.addedNodes[0].src)
          }
        }
      })
    })

    observer.observe(this._pasteCatcher, {
      childList: true,
      attributes: true,
      characterData: true
    })
  }

  /**
   * 处理非标准的 paste 事件, 从 image 标签中获取数据
   * @private
   * @param {string} source image 标签的 src 属性
   */
  _pasteCreateImage (source) {
    const pasteImage = new Image()
    pasteImage.src = source
    console.log(source, pasteImage)
  }

  /**
   * 处理页面按键按下
   * @private
   * @param {KeyboardEvent} event
   */
  _handleOnKeyDown (event) {

  }

  /**
   * 处理页面按下释放
   * @private
   * @param {KeyboardEvent} event
   */
  _handleOnKeyUp (event) {
    const { keyCode } = event

    if (keyCode === 17 || event.metaKey || event.ctrlKey) {
      if (this._ctrlPressed === false) {
        this._ctrlPressed = true
      }
    }

    if (keyCode === 86) {
      if (document.activeElement !== null || document.activeElement.type === 'text') {
        // 允许用户拷贝文字进入输入框
        return false
      }

      if (this._ctrlPressed === true) {
        this._pasteCatcher.focus()
      }
    }
  }

  /**
   * 处理页面的 paste 事件
   * @private
   * @param {ClipboardEvent} event
   */
  _handleOnPaste (event) {
    this._pasteCatcher.innerHTML = ''
    if (event.clipboardData) {
      const { items } = event.clipboardData

      if (items) {
        this._pasteEventSupport = true

        ;[...items].forEach((item) => {
          if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile()
            console.log(blob)
          }
        })
      }
    }
  }

  /**
   * 监听事件, 将 pasteCatcher 放入 body 中
   * @public
   */
  install () {
    document.body.appendChild(this._pasteCatcher)
    document.addEventListener('keydown', this._handleOnKeyDown)
    document.addEventListener('keyup', this._handleOnKeyUp)
    document.addEventListener('paste', this._handleOnPaste)
  }

  uninstall () {
    document.body.removeChild(this._pasteCatcher)
    document.removeEventListener('keydown', this._handleOnKeyDown)
    document.removeEventListener('keyup', this._handleOnKeyUp)
    document.removeEventListener('paste', this._handleOnPaste)
  }
}

const uploadUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:4300/api/v1/images' : '/api/v1/images'

const Home = () => {
  const [fileList, setFileList] = React.useState([])

  React.useEffect(() => {
    const pasteImage = new PasteImage((blob) => {
      console.log(blob)
    })
    pasteImage.install()
    return () => pasteImage.uninstall()
  }, [])

  const tabsPanes = fileList.map(({ url, status, name, size, type, response }, index) => {
    let result
    if (status === 'uploading') {
      result = <div>uploading</div>
    } else if (status === 'error') {
      result = <div>error</div>
    } else if (status === 'done') {
      const { deleteKey, cdnPath } = response.images[name]
      result = (
        <>
          <CopyInput data-e2e-test-id='UPLOAD_RESULT_HTML' value={`<a href="${cdnPath}"></a>`} addonBefore='HTML' />
          <CopyInput data-e2e-test-id='UPLOAD_RESULT_URL' className='mt-2' value={cdnPath} addonBefore='URL' />
          <CopyInput data-e2e-test-id='UPLOAD_RESULT_MARKDOWN' className='mt-2' value={`![](${cdnPath})`} addonBefore='markdown' />
          <CopyInput data-e2e-test-id='UPLOAD_RESULT_IMAGE' className='mt-2' value={`<img src="${cdnPath}" />`} addonBefore='image' />
          <CopyInput data-e2e-test-id='UPLOAD_RESULT_DELETE' className='mt-2' value={deleteKey} addonBefore={<span className='text-red'>移除图片</span>} />
        </>
      )
    } else {
      const errors = []
      if (size > FILE_MAX_SIZE) {
        errors.push(
          <li key='文件超大'>文件超过最大限制, 最大限制为 {FILE_MAX_SIZE / 1024 / 1024}M</li>
        )
      }

      if (!FILE_TYPE_ALLOWED.includes(type)) {
        errors.push(
          <li key='类型不对'>格式不正确</li>
        )
      }
      result = (
        <>
          <div>不能上传 {name}, 原因如下:</div>
          <ul>
            {errors.length ? errors : '未知错误'}
          </ul>
        </>
      )
    }
    return (
      <Tabs.TabPane tab={`image ${name}`} key={index}>
        {result}
      </Tabs.TabPane>
    )
  })

  const handleBeforeUpload = ({ size, type }) => {
    if (size > FILE_MAX_SIZE) {
      return false
    } else if (!FILE_TYPE_ALLOWED.includes(type)) {
      return false
    }

    return true
  }

  const handleChange = (event) => {
    console.log(event)
    const fileList = [...event.fileList]
    setFileList(fileList)
  }
  return (
    <>
      <div className='upload' data-e2e-test-id='UPLOAD_CLICK_AREA'>
        <Upload.Dragger
          beforeUpload={handleBeforeUpload}
          multiple
          onChange={handleChange}
          accept='.png, .jpg, .jpeg, .svg, .webp'
          action={uploadUrl}
          name='images'
        >
          <p className='ant-upload-drag-icon'>
            <Icon type='inbox' />
          </p>
          <p className='ant-upload-text'>点击或者是拖拽文件到这里来上传</p>
          <p className='ant-upload-hint'>允许 .png, .jpg, .jpeg, .svg, .webp 后缀的文件</p>
        </Upload.Dragger>
      </div>
      <div className='result mt-3' data-e2e-test-id='UPLOAD_RESULTS'>
        {tabsPanes.length ? (
          <Tabs>
            {tabsPanes}
          </Tabs>
        ) : (
          <Empty />
        )}
      </div>
    </>
  )
}

export default Home
