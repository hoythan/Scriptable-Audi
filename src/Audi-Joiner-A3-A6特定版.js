// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: car;
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: code-branch;
//

class Base {
  constructor(arg = '') {
    this.arg = arg
    this._actions = {}
    this.init()
  }

  init(widgetFamily = config.widgetFamily) {
    // 组件大小：small,medium,large
    this.widgetFamily = widgetFamily
    // 系统设置的key，这里分为三个类型：
    // 1. 全局
    // 2. 不同尺寸的小组件
    // 3. 不同尺寸+小组件自定义的参数
    // 当没有key2时，获取key1，没有key1获取全局key的设置
    // this.SETTING_KEY = this.md5(Script.name()+'@'+this.widgetFamily+'@'+this.arg)
    // this.SETTING_KEY1 = this.md5(Script.name()+'@'+this.widgetFamily)
    this.SETTING_KEY = this.md5(Script.name())
    // 插件设置
    this.settings = this.getSettings()
  }

  /**
   * 注册点击操作菜单
   * @param {string} name 操作函数名
   * @param {function} func 点击后执行的函数
   */
  registerAction(name, func) {
    this._actions[name] = func.bind(this)
  }

  /**
   * 生成操作回调URL，点击后执行本脚本，并触发相应操作
   * @param {string} name 操作的名称
   * @param {string} data 传递的数据
   */
  actionUrl(name = '', data = '') {
    let u = URLScheme.forRunningScript()
    let q = `act=${encodeURIComponent(name)}&data=${encodeURIComponent(data)}&__arg=${encodeURIComponent(this.arg)}&__size=${this.widgetFamily}`
    let result = ''
    if (u.includes('run?')) {
      result = `${u}&${q}`
    } else {
      result = `${u}?${q}`
    }
    return result
  }

  /**
   * HTTP 请求接口
   * @param options 配置项
   * @return {string | json | null}
   */
  async http(options) {
    const url = options?.url || url
    const method = options?.method || 'GET'
    const headers = options?.headers || {}
    const body = options?.body || ''
    const json = options?.json || true

    let response = new Request(url)
    response.method = method
    response.headers = headers
    if (method === 'POST' || method === 'post') response.body = body
    return (json ? response.loadJSON() : response.loadString())
  }

  /**
   * 获取远程图片内容
   * @param {string} url 图片地址
   * @param {boolean} useCache 是否使用缓存（请求失败时获取本地缓存）
   */
  async getImageByUrl(url, useCache = true) {
    const cacheKey = this.md5(url)
    const cacheFile = FileManager.local().joinPath(FileManager.local().temporaryDirectory(), cacheKey)
    // 判断是否有缓存
    if (useCache && FileManager.local().fileExists(cacheFile)) {
      return Image.fromFile(cacheFile)
    }
    try {
      const req = new Request(url)
      const img = await req.loadImage()
      // 存储到缓存
      FileManager.local().writeImage(cacheFile, img)
      return img
    } catch (e) {
      // 没有缓存+失败情况下，返回自定义的绘制图片（红色背景）
      let ctx = new DrawContext()
      ctx.size = new Size(100, 100)
      ctx.setFillColor(Color.red())
      ctx.fillRect(new Rect(0, 0, 100, 100))
      return ctx.getImage();
    }
  }

  /**
   * 弹出一个通知
   * @param {string} title 通知标题
   * @param {string} body 通知内容
   * @param {string} url 点击后打开的URL
   * @param opts
   */
  async notify(title, body = '', url = undefined, opts = {}) {
    let n = new Notification()
    n = Object.assign(n, opts)
    n.title = title
    n.body = body
    if (url) n.openURL = url
    return await n.schedule()
  }

  /**
   * 给图片加一层半透明遮罩
   * @param {Image} img 要处理的图片
   * @param {string} color 遮罩背景颜色
   * @param {float} opacity 透明度
   */
  async shadowImage(img, color = '#000000', opacity = 0.7) {
    let ctx = new DrawContext()
    // 获取图片的尺寸
    ctx.size = img.size

    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']))
    ctx.setFillColor(new Color(color, opacity))
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']))

    return ctx.getImage()
  }

  /**
   * 获取当前插件的设置
   * @param {boolean} json 是否为json格式
   */
  getSettings(json = true) {
    let res = json ? {} : ''
    let cache = ''
    if (Keychain.contains(this.SETTING_KEY)) {
      cache = Keychain.get(this.SETTING_KEY)
    }
    if (json) {
      try {
        res = JSON.parse(cache)
      } catch (e) {
      }
    } else {
      res = cache
    }

    return res
  }

  /**
   * 存储当前设置
   * @param {boolean} notify 是否通知提示
   */
  saveSettings(notify = true) {
    let res = (typeof this.settings === 'object') ? JSON.stringify(this.settings) : String(this.settings)
    Keychain.set(this.SETTING_KEY, res)
    if (notify) this.notify('设置成功', '桌面组件稍后将自动刷新')
  }

  /**
   * md5 加密
   * @param string
   * @returns {string}
   */
  md5(string) {
    const safeAdd = (x, y) => {
      let lsw = (x & 0xFFFF) + (y & 0xFFFF)
      return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xFFFF)
    }
    const bitRotateLeft = (num, cnt) => (num << cnt) | (num >>> (32 - cnt))
    const md5cmn = (q, a, b, x, s, t) => safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b),
      md5ff = (a, b, c, d, x, s, t) => md5cmn((b & c) | ((~b) & d), a, b, x, s, t),
      md5gg = (a, b, c, d, x, s, t) => md5cmn((b & d) | (c & (~d)), a, b, x, s, t),
      md5hh = (a, b, c, d, x, s, t) => md5cmn(b ^ c ^ d, a, b, x, s, t),
      md5ii = (a, b, c, d, x, s, t) => md5cmn(c ^ (b | (~d)), a, b, x, s, t)
    const firstChunk = (chunks, x, i) => {
        let [a, b, c, d] = chunks;
        a = md5ff(a, b, c, d, x[i + 0], 7, -680876936)
        d = md5ff(d, a, b, c, x[i + 1], 12, -389564586)
        c = md5ff(c, d, a, b, x[i + 2], 17, 606105819)
        b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330)

        a = md5ff(a, b, c, d, x[i + 4], 7, -176418897)
        d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426)
        c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341)
        b = md5ff(b, c, d, a, x[i + 7], 22, -45705983)

        a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416)
        d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417)
        c = md5ff(c, d, a, b, x[i + 10], 17, -42063)
        b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162)

        a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682)
        d = md5ff(d, a, b, c, x[i + 13], 12, -40341101)
        c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290)
        b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329)

        return [a, b, c, d]
      },
      secondChunk = (chunks, x, i) => {
        let [a, b, c, d] = chunks;
        a = md5gg(a, b, c, d, x[i + 1], 5, -165796510)
        d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632)
        c = md5gg(c, d, a, b, x[i + 11], 14, 643717713)
        b = md5gg(b, c, d, a, x[i], 20, -373897302)

        a = md5gg(a, b, c, d, x[i + 5], 5, -701558691)
        d = md5gg(d, a, b, c, x[i + 10], 9, 38016083)
        c = md5gg(c, d, a, b, x[i + 15], 14, -660478335)
        b = md5gg(b, c, d, a, x[i + 4], 20, -405537848)

        a = md5gg(a, b, c, d, x[i + 9], 5, 568446438)
        d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690)
        c = md5gg(c, d, a, b, x[i + 3], 14, -187363961)
        b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501)

        a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467)
        d = md5gg(d, a, b, c, x[i + 2], 9, -51403784)
        c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473)
        b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734)

        return [a, b, c, d]
      },
      thirdChunk = (chunks, x, i) => {
        let [a, b, c, d] = chunks;
        a = md5hh(a, b, c, d, x[i + 5], 4, -378558)
        d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463)
        c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562)
        b = md5hh(b, c, d, a, x[i + 14], 23, -35309556)

        a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060)
        d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353)
        c = md5hh(c, d, a, b, x[i + 7], 16, -155497632)
        b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640)

        a = md5hh(a, b, c, d, x[i + 13], 4, 681279174)
        d = md5hh(d, a, b, c, x[i], 11, -358537222)
        c = md5hh(c, d, a, b, x[i + 3], 16, -722521979)
        b = md5hh(b, c, d, a, x[i + 6], 23, 76029189)

        a = md5hh(a, b, c, d, x[i + 9], 4, -640364487)
        d = md5hh(d, a, b, c, x[i + 12], 11, -421815835)
        c = md5hh(c, d, a, b, x[i + 15], 16, 530742520)
        b = md5hh(b, c, d, a, x[i + 2], 23, -995338651)

        return [a, b, c, d]
      },
      fourthChunk = (chunks, x, i) => {
        let [a, b, c, d] = chunks;
        a = md5ii(a, b, c, d, x[i], 6, -198630844)
        d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415)
        c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905)
        b = md5ii(b, c, d, a, x[i + 5], 21, -57434055)

        a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571)
        d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606)
        c = md5ii(c, d, a, b, x[i + 10], 15, -1051523)
        b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799)

        a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359)
        d = md5ii(d, a, b, c, x[i + 15], 10, -30611744)
        c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380)
        b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649)

        a = md5ii(a, b, c, d, x[i + 4], 6, -145523070)
        d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379)
        c = md5ii(c, d, a, b, x[i + 2], 15, 718787259)
        b = md5ii(b, c, d, a, x[i + 9], 21, -343485551)
        return [a, b, c, d]
      }
    const binlMD5 = (x, len) => {
      /* append padding */
      x[len >> 5] |= 0x80 << (len % 32)
      x[(((len + 64) >>> 9) << 4) + 14] = len;
      let commands = [firstChunk, secondChunk, thirdChunk, fourthChunk],
        initialChunks = [
          1732584193,
          -271733879,
          -1732584194,
          271733878
        ];
      return Array.from({length: Math.floor(x.length / 16) + 1}, (v, i) => i * 16)
        .reduce((chunks, i) => commands
          .reduce((newChunks, apply) => apply(newChunks, x, i), chunks.slice())
          .map((chunk, index) => safeAdd(chunk, chunks[index])), initialChunks)

    }
    const binl2rstr = input => Array(input.length * 4).fill(8).reduce((output, k, i) => output + String.fromCharCode((input[(i * k) >> 5] >>> ((i * k) % 32)) & 0xFF), '')
    const rstr2binl = input => Array.from(input).map(i => i.charCodeAt(0)).reduce((output, cc, i) => {
      let resp = output.slice()
      resp[(i * 8) >> 5] |= (cc & 0xFF) << ((i * 8) % 32)
      return resp
    }, [])
    const rstrMD5 = string => binl2rstr(binlMD5(rstr2binl(string), string.length * 8))
    const rstr2hex = input => {
      const hexTab = (pos) => '0123456789abcdef'.charAt(pos);
      return Array.from(input).map(c => c.charCodeAt(0)).reduce((output, x, i) => output + hexTab((x >>> 4) & 0x0F) + hexTab(x & 0x0F), '')
    }
    const str2rstrUTF8 = unicodeString => {
      if (typeof unicodeString !== 'string') throw new TypeError('parameter ‘unicodeString’ is not a string');
      const cc = c => c.charCodeAt(0);
      return unicodeString
        .replace(/[\u0080-\u07ff]/g,  // U+0080 - U+07FF => 2 bytes 110yyyyy, 10zzzzzz
          c => String.fromCharCode(0xc0 | cc(c) >> 6, 0x80 | cc(c) & 0x3f))
        .replace(/[\u0800-\uffff]/g,  // U+0800 - U+FFFF => 3 bytes 1110xxxx, 10yyyyyy, 10zzzzzz
          c => String.fromCharCode(0xe0 | cc(c) >> 12, 0x80 | cc(c) >> 6 & 0x3F, 0x80 | cc(c) & 0x3f))
    }
    const rawMD5 = s => rstrMD5(str2rstrUTF8(s))
    const hexMD5 = s => rstr2hex(rawMD5(s))
    return hexMD5(string)
  }
}

// @base.end
// 运行环境
// @running.start
const Running = async (Widget, default_args = '') => {
  let M = null
  // 判断hash是否和当前设备匹配
  if (config.runsInWidget) {
    M = new Widget(args.widgetParameter || '')
    const W = await M.render()
    Script.setWidget(W)
    Script.complete()
  } else {
    let {act, data, __arg, __size} = args.queryParameters
    M = new Widget(__arg || default_args || '')
    if (__size) M.init(__size)
    if (!act || !M['_actions']) {
      // 弹出选择菜单
      const actions = M['_actions']
      const _actions = []
      const alert = new Alert()
      alert.title = M.name
      alert.message = M.desc
      for (let _ in actions) {
        alert.addAction(_)
        _actions.push(actions[_])
      }
      alert.addCancelAction('取消操作')
      const idx = await alert.presentSheet()
      if (_actions[idx]) {
        const func = _actions[idx]
        await func()
      }
      return
    }
    let _tmp = act.split('-').map(_ => _[0].toUpperCase() + _.substr(1)).join('')
    let _act = `action${_tmp}`
    if (M[_act] && typeof M[_act] === 'function') {
      const func = M[_act].bind(M)
      await func(data)
    }
  }
}


const AUDI_VERSION = 1.1
const DEFAULT_LIGHT_BACKGROUND_COLOR_1 = '#FFFFFF'
const DEFAULT_LIGHT_BACKGROUND_COLOR_2 = '#B2D4EC'
const DEFAULT_DARK_BACKGROUND_COLOR_1 = '#404040'
const DEFAULT_DARK_BACKGROUND_COLOR_2 = '#1E1E1E'

const AUDI_SERVER_API = {
  login: 'https://audi2c.faw-vw.com/capi/v1/user/login',
  token: 'https://mbboauth-1d.prd.cn.vwg-connect.cn/mbbcoauth/mobile/oauth2/v1/token',
  mine: 'https://audi2c.faw-vw.com/capi/v1/user/mine',
  vehiclesStatus: vin => `https://mal-3a.prd.cn.dp.vwg-connect.cn/api/bs/vsr/v1/vehicles/${vin}/status`,
  vehiclesPosition: vin => `https://mal-3a.prd.cn.dp.vwg-connect.cn/api/bs/cf/v1/vehicles/${vin}/position`
}
const REQUEST_HEADER = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': 'MyAuDi/3.0.2 CFNetwork/1325.0.1 Darwin/21.1.0',
  'X-Client-ID': 'de6d8b23-792f-47b8-82f4-e4cc59c2916e'
}
const DEFAULT_MY_CAR_PHOTO = 'https://gitee.com/JaxsonWang/scriptable-audi/raw/master/assets/cars/2020A4LB9_20211127.png'
const DEFAULT_AUDI_LOGO = 'https://gitee.com/JaxsonWang/scriptable-audi/raw/master/assets/images/logo_20211127.png'
const GLOBAL_USER_DATA = {
  seriesName: '奥迪A4L B9',
  modelShortName: '2.0 140KW',
  vin: 'LFV3A28W3L3651234',
  engineNo: 'DTA050571',
  plateNo: '', // 车牌号
  endurance: 0, // NEDC 续航
  fuelLevel: 0, // 汽油 单位百分比
  mileage: 0, // 总里程
  carLocation: '',
  longitude: '',
  latitude: '',
  status: true, // 0 = 已锁车
  doorAndWindow: '', // 门窗状态
  myOne: '世间美好，与你环环相扣'
}
const AUDI_AMAP_KEY = 'c078fb16379c25bc0aad8633d82cf1dd'

class Widget extends Base {
  /**
   * 传递给组件的参数，可以是桌面 Parameter 数据，也可以是外部如 URLScheme 等传递的数据
   * @param {string} arg 自定义参数
   */
  constructor(arg) {
    super(arg)
    this.name = 'Audi 挂件'
    this.desc = 'Audi 车辆桌面组件展示'

    if (config.runsInApp) {
      this.registerAction('账户登录', this.actionStatementSettings)
      this.registerAction('个性化配置', this.actionPreferenceSettings)
      this.registerAction('退出登录', this.actionLogOut)
      this.registerAction('检查更新', this.actionCheckUpdate)
      this.registerAction('打赏作者', this.actionDonation)
      this.registerAction('关于小组件', this.actionAbout)
      this.registerAction('获取日志', this.actionLogAction)
    }
  }

  /**
   * 渲染函数，函数名固定
   * 可以根据 this.widgetFamily 来判断小组件尺寸，以返回不同大小的内容
   */
  async render() {
    const data = await this.getData()
    if (data) {
      switch (this.widgetFamily) {
        case 'large':
          return await this.renderLarge(data)
        case 'medium':
          return await this.renderMedium(data)
        default:
          return await this.renderSmall(data)
      }
    } else {
      return await this.renderEmpty()
    }
  }

  /**
   * 渲染小尺寸组件
   */
  async renderSmall(data) {
    const widget = new ListWidget()
    widget.backgroundGradient = this.getBackgroundColor()

    widget.addSpacer(20)

    const header = widget.addStack()
    header.centerAlignContent()

    const _title = header.addText(data.seriesName)
    _title.textOpacity = 1
    _title.font = Font.systemFont(18)
    // const _icon = header.addImage(await this.getImageByUrl(data.logo))
    // _icon.imageSize = new Size(30, 30)
    // _icon.rightAlignImage()

    widget.addSpacer(0)

    const content = widget.addStack()
    content.bottomAlignContent()
    const _fuelStroke = content.addText(data.endurance + 'km')
    _fuelStroke.font = Font.heavySystemFont(20)
    content.addSpacer(2)
    const _cut = content.addText('/')
    _cut.font = Font.systemFont(16)
    _cut.textOpacity = 0.75
    content.addSpacer(2)
    const _fuelLevel = content.addText(data.fuelLevel + '%')
    _fuelLevel.font = Font.systemFont(16)
    _fuelLevel.textOpacity = 0.75

    widget.addSpacer(10)

    const _audiImage = widget.addImage(await this.getMyCarPhoto())
    _audiImage.imageSize = new Size(100, 80)
    _audiImage.rightAlignImage()
    return widget
  }

  /**
   * 渲染中尺寸组件
   */
  async renderMedium(data) {
    const widget = new ListWidget()
    widget.backgroundGradient = this.getBackgroundColor()

    // 宽度
    const widgetWidth = Device.screenResolution().width / Device.screenScale()
    const screenSize = Device.screenSize().width
    // 解决 1080 分辨率显示的问题
    const widthInterval = widgetWidth - screenSize <= 0 ? 40 : widgetWidth - screenSize + 10
    const width = widgetWidth / 2 - widthInterval

    // 添加 Audi Stack
    const logoStack = widget.addStack()
    logoStack.size = new Size(widgetWidth, logoStack.size.height)
    logoStack.addSpacer(width * 2 - 50) // 使图片顶到右边显示
    // 添加 Audi Logo
    const _audiLogo = logoStack.addImage(await this.getImageByUrl(DEFAULT_AUDI_LOGO))
    _audiLogo.imageSize = new Size(50, 15)


    const stack = widget.addStack()
    stack.size = new Size(widgetWidth, stack.size.height)

    // region leftStack start
    const leftStack = stack.addStack()
    leftStack.size = new Size(width, leftStack.size.height)
    leftStack.layoutVertically()

    const _title = leftStack.addText(data.seriesName)
    _title.textOpacity = 1
    _title.font = Font.systemFont(18)
    leftStack.addSpacer(2)
    const _desc = leftStack.addText(data.modelShortName)
    _desc.textOpacity = 0.75
    _desc.font = Font.systemFont(14)
    leftStack.addSpacer(10)
    const content = leftStack.addStack()
    content.bottomAlignContent()
    const _fuelStroke = content.addText(data.endurance + 'km')
    _fuelStroke.font = Font.heavySystemFont(20)
    content.addSpacer(2)
    const _cut = content.addText('/')
    _cut.font = Font.systemFont(16)
    _cut.textOpacity = 0.75
    content.addSpacer(2)
    const _fuelLevel = content.addText(data.fuelLevel + '%')
    _fuelLevel.font = Font.systemFont(16)
    _fuelLevel.textOpacity = 0.75
    // 总行程
    const _trips = leftStack.addText('总里程: ' + data.mileage + ' km')
    _trips.textOpacity = 0.75
    _trips.font = Font.systemFont(14)

    const carLocation = data.carLocation
    this.splitStr2Arr(carLocation, 14).forEach(item => {
      const _location = leftStack.addText(item)
      _location.textOpacity = 0.75
      _location.font = Font.systemFont(12)
    })

    // endregion leftStack end

    // region rightStack start
    const rightStack = stack.addStack()
    rightStack.size = new Size(width, rightStack.size.height)
    rightStack.layoutVertically()

    const audiStack = rightStack.addStack()
    audiStack.setPadding(20, 0, 10, 0)

    const _audiImage = audiStack.addImage(await this.getMyCarPhoto())
    _audiImage.imageSize = new Size(rightStack.size.width, 60)
    _audiImage.applyFillingContentMode()

    const rightBottomStack = rightStack.addStack()
    rightBottomStack.size = new Size(rightStack.size.width, 15)
    // 车辆状态
    let getCarStatus = data.status ? '已锁车' : '未锁车'
    data.doorAndWindow ? getCarStatus += '并且门窗已关闭' : getCarStatus = '请检查车窗是否已关闭'
    const _audiStatus = rightBottomStack.addText(getCarStatus)
    _audiStatus.font = Font.systemFont(12)
    if (!data.status || !data.doorAndWindow) _audiStatus.textColor = new Color('#FF9900', 1)

    // endregion

    // 祝语
    widget.addSpacer(5)
    const tipStack = widget.addStack()
    tipStack.size = new Size(widgetWidth, tipStack.size.height)

    const _tips = tipStack.addText(data.myOne)
    _tips.textOpacity = 1
    _tips.font = Font.systemFont(12)
    _tips.centerAlignText()

    // debug
    // stack.backgroundColor = Color.green()
    // logoStack.backgroundColor = Color.blue()
    // leftStack.backgroundColor = Color.gray()
    // rightStack.backgroundColor = Color.gray()
    // audiStack.backgroundColor = Color.brown()
    // rightBottomStack.backgroundColor = Color.lightGray()
    // tipStack.backgroundColor = Color.brown()

    return widget
  }

  /**
   * 渲染大尺寸组件
   */
  async renderLarge(data) {
    const widget = new ListWidget()

    widget.backgroundImage = await this.shadowImage(await this.getImageByUrl(DEFAULT_MY_CAR_PHOTO))

    const text = widget.addText('靓仔，还不支持大组件，等耐心等待作者开发！')
    text.font = Font.blackSystemFont(15)
    text.textColor = Color.white()
    text.centerAlignText()

    return widget
  }

  /**
   * 渲染空数据组件
   * @returns {Promise<ListWidget>}
   */
  async renderEmpty() {
    const widget = new ListWidget()

    widget.backgroundImage = await this.shadowImage(await this.getImageByUrl(DEFAULT_MY_CAR_PHOTO))

    const text = widget.addText('欢迎使用 Audi-Joiner iOS 桌面组件')
    text.font = Font.blackSystemFont(18)
    text.textColor = Color.white()
    text.centerAlignText()

    return widget
  }

  /**
   * 渲染标题内容
   * @param {object} widget 组件对象
   * @param {string} icon 图标地址
   * @param {string} title 标题内容
   * @param {boolean|string} color 字体的颜色（自定义背景时使用，默认系统）
   */
  async renderHeaderOverload(widget, icon, title, color = false) {
    widget.addSpacer(10)
    let header = widget.addStack()
    header.centerAlignContent()
    let _icon = header.addImage(await this.getImageByUrl(icon))
    _icon.imageSize = new Size(80, 40)
    _icon.cornerRadius = 4
    header.addSpacer(10)
    let _title = header.addText(title)
    if (color) _title.textColor = color
    _title.textOpacity = 0.7
    _title.font = Font.boldSystemFont(12)
    widget.addSpacer(10)
    return widget
  }

  /**
   * 渐变色
   * @returns {LinearGradient}
   */
  getBackgroundColor() {
    const bgColor = new LinearGradient()

    const lightBgColor1 = this.settings['lightBgColor1'] ? this.settings['lightBgColor1'] : DEFAULT_LIGHT_BACKGROUND_COLOR_1
    const lightBgColor2 = this.settings['lightBgColor2'] ? this.settings['lightBgColor2'] : DEFAULT_LIGHT_BACKGROUND_COLOR_2
    const darkBgColor1 = this.settings['darkBgColor1'] ? this.settings['darkBgColor1'] : DEFAULT_DARK_BACKGROUND_COLOR_1
    const darkBgColor2 = this.settings['darkBgColor2'] ? this.settings['darkBgColor2'] : DEFAULT_DARK_BACKGROUND_COLOR_2

    const startColor = Color.dynamic(new Color(lightBgColor1, 1), new Color(darkBgColor1, 1))
    const endColor = Color.dynamic(new Color(lightBgColor2, 1), new Color(darkBgColor2, 1))

    bgColor.colors = [startColor, endColor]

    bgColor.locations = [0.0, 1.0]

    return bgColor
  }

  /**
   * 处理数据业务
   * @returns {Promise<{Object}>}
   */
  async bootstrap() {
    try {
      const getUserMineData = JSON.parse(Keychain.get('userMineData'))
      const getVehicleData = getUserMineData.vehicleDto

      if (getVehicleData.seriesName) GLOBAL_USER_DATA.seriesName = getVehicleData.seriesName // 车辆型号
      if (getVehicleData.carModelName) GLOBAL_USER_DATA.modelShortName = getVehicleData.carModelName // 车辆功率类型
      if (getVehicleData.vin) GLOBAL_USER_DATA.vin = getVehicleData.vin // 车架号
      if (getVehicleData.engineNo) GLOBAL_USER_DATA.engineNo = getVehicleData.engineNo // 发动机型号
      if (getVehicleData.plateNo) GLOBAL_USER_DATA.plateNo = getVehicleData.plateNo // 车牌号
    } catch (e) {
      console.error(e)
    }

    const getVehiclesStatus = await this.handleVehiclesStatus()
    // todo 非空判断
    const getVehicleResponseData = getVehiclesStatus?.StoredVehicleDataResponse?.vehicleData?.data
    const getVehiclesStatusArr = getVehicleResponseData ? getVehicleResponseData : []
    // todo
    let getVehiclesPosition = {}
    let getVehiclesAddress = ''
    try {
      getVehiclesPosition = JSON.parse(await this.handleVehiclesPosition())
      getVehiclesAddress = await this.handleGetCarAddress()
    } catch (error) {
      getVehiclesAddress = '暂无位置信息'
    }

    const getCarStatusArr = getVehiclesStatusArr.find(i => i.id === '0x0301FFFFFF').field
    const enduranceVal = getCarStatusArr.find(i => i.id === '0x0301030005').value // 燃料总行程
    const fuelLevelVal = getCarStatusArr.find(i => i.id === '0x030103000A').value // 燃料百分比
    const mileageVal = getVehiclesStatusArr.find(i => i.id === '0x0101010002').field[0].value // 总里程

    // 检查门锁 车门 车窗等状态
    const isLocked = await this.getCarIsLocked(getCarStatusArr)
    const doorStatusArr = await this.getCarDoorStatus(getCarStatusArr)
    const windowStatusArr = await this.getCarWindowStatus(getCarStatusArr)
    const equipmentStatusArr = [...doorStatusArr, ...windowStatusArr].map(i => i.name)
    // 写入信息
    if (enduranceVal) GLOBAL_USER_DATA.endurance = enduranceVal // NEDC 续航 单位 km
    if (fuelLevelVal) GLOBAL_USER_DATA.fuelLevel = fuelLevelVal // 燃料 单位百分比
    if (mileageVal) GLOBAL_USER_DATA.mileage = mileageVal // 总里程
    if (getVehiclesAddress) GLOBAL_USER_DATA.carLocation = getVehiclesAddress // 详细地理位置
    if (getVehiclesPosition.longitude) GLOBAL_USER_DATA.longitude = getVehiclesPosition.longitude // 车辆经度
    if (getVehiclesPosition.latitude) GLOBAL_USER_DATA.latitude = getVehiclesPosition.latitude // 车辆纬度
    if (isLocked !== undefined) GLOBAL_USER_DATA.status = isLocked // 车辆状态 true = 已锁车
    if (equipmentStatusArr) GLOBAL_USER_DATA.doorAndWindow = equipmentStatusArr.length === 0 // true 车窗已关闭 | false 请检查车窗是否关闭
    if (this.settings['myOne']) GLOBAL_USER_DATA.myOne = this.settings['myOne'] // 一言

    return GLOBAL_USER_DATA
  }

  /**
   * 获取车辆锁车状态
   * @param {Array} arr
   * @return Promise<{boolean}> true = 锁车 false = 没有完全锁车
   */
  async getCarIsLocked (arr) {
    // 先判断车辆是否锁定
    const lockArr = ['0x0301040001', '0x0301040004', '0x0301040007', '0x030104000A', '0x030104000D']
    // 筛选出对应的数组
    const filterArr = arr.filter(item => lockArr.some(i => i === item.id))
    // 判断是否都锁门
    // value === 2 锁门
    // value === 3 未锁门
    return filterArr.every(item => item.value === '2')
  }

  /**
   * 获取车辆车门/引擎盖/后备箱状态
   * @param {Array} arr
   * @return Promise<[]<{
   *   id: string
   *   name: string
   * }>>
   */
  async getCarDoorStatus (arr) {
    const doorArr = [
      {
        id: '0x0301040002',
        name: '左前门'
      }, {
        id: '0x0301040005',
        name: '左后门'
      }, {
        id: '0x0301040008',
        name: '右前门'
      }, {
        id: '0x030104000B',
        name: '右后门'
      }, {
        id: '0x0301040011',
        name: '引擎盖'
      }, {
        id: '0x030104000E',
        name: '后备箱'
      }
    ]
    // 筛选出对应的数组
    const filterArr = arr.filter(item => doorArr.some(i => i.id === item.id))
    // 筛选出没有关门id
    const result = filterArr.filter(item => item.value === '2')
    // 返回开门的数组
    return doorArr.filter(i => result.some(x => x.id === i.id))
  }

  /**
   * 获取车辆车窗/天窗状态
   * @param {Array} arr
   * @return Promise<[]<{
   *   id: string
   *   name: string
   * }>>
   */
  async getCarWindowStatus (arr) {
    const windowArr = [
      {
        id: '0x0301050001',
        name: '左前窗'
      }, {
        id: '0x0301050003',
        name: '左后窗'
      }, {
        id: '0x0301050005',
        name: '右前窗'
      }, {
        id: '0x0301050007',
        name: '右后窗'
      }, {
        id: '0x030105000B',
        name: '天窗'
      }
    ]
    // 筛选出对应的数组
    const filterArr = arr.filter(item => windowArr.some(i => i.id === item.id))
    // 筛选出没有关门id
    const result = filterArr.filter(item => item.value === '2')
    // 返回开门的数组
    return windowArr.filter(i => result.some(x => x.id === i.id))
  }

  /**
   * 获取数据
   */
  async getData() {
    // 判断用户是否已经登录
    return Keychain.contains('userBaseInfoData') ? await this.bootstrap() : false
  }

  /**
   * 获取用户车辆照片
   * @returns {Promise<Image|*>}
   */
  async getMyCarPhoto() {
    let myCarPhoto = await this.getImageByUrl(DEFAULT_MY_CAR_PHOTO)
    if (this.settings['myCarPhoto']) myCarPhoto = await this.getImageByUrl(this.settings['myCarPhoto'])
    return myCarPhoto
  }

  /**
   * 登录奥迪服务器
   * @param {boolean} isDebug
   * @returns {Promise<void>}
   */
  async handleAudiLogin(isDebug = false) {
    if (!Keychain.contains('userBaseInfoData')) {
      const options = {
        url: AUDI_SERVER_API.login,
        method: 'POST',
        headers: REQUEST_HEADER,
        body: JSON.stringify({
          loginChannelEnum: 'APP',
          loginTypeEnum: 'ACCOUNT_PASSWORD',
          account: this.settings['username'],
          password: this.settings['password']
        })
      }
      const response = await this.http(options)
      if (isDebug) console.log('获取登陆信息:')
      if (isDebug) console.log(response)
      // 判断接口状态
      if (response.code === 0) {
        // 登录成功 存储登录信息
        console.log('登陆成功')
        Keychain.set('userBaseInfoData', JSON.stringify(response.data))
        await this.notify('登录成功', '正在从 Audi 服务器获取车辆数据，请耐心等待！')
        // 准备交换验证密钥数据
        await this.handleAudiGetToken('userIDToken')
        await this.handleUserMineData()
      } else {
        // 登录异常
        await this.notify('登录失败', response.message)
        console.log('用户登录失败：' + response.message)
      }
    } else {
      // 已存在用户信息
      if (isDebug) console.log('检测本地缓存已有登陆数据:')
      if (isDebug) console.log(Keychain.get('userBaseInfoData'))
      await this.handleAudiGetToken('userIDToken')
      await this.handleUserMineData()
    }
  }

  /**
   * 获取车辆基本信息
   * 该接口因为加密问题暂时放弃
   * @returns {Promise<void>}
   */
  async handleQueryDefaultVehicleData() {
    if (!Keychain.contains('defaultVehicleData')) {
      if (!Keychain.contains('userBaseInfoData')) {
        return this.notify('获取密钥数据失败', '没有拿到用户登录信息，请重新登录再重试！')
      }
      const getUserBaseInfoData =JSON.parse(Keychain.get('userBaseInfoData'))
      const options = {
        url: AUDI_SERVER_API.vehicleServer,
        method: 'GET',
        headers: {
          ...{
            Authorization: 'Bearer ' + getUserBaseInfoData.accessToken
          },
          ...REQUEST_HEADER
        }
      }
      const response = await this.http(options)
      // 判断接口状态
      if (response.status !== 'SUCCEED') {
        // 存储车辆信息
        Keychain.set('defaultVehicleData', JSON.stringify(response.data))
        Keychain.set('myCarVIN', response.data?.vin)
        console.log('车辆基本信息获取成功')
        // 准备交换验证密钥数据
        await this.handleAudiGetToken('userRefreshToken')
      } else {
        // 获取异常
        await this.notify('车辆信息获取失败', '请稍后重新登录再重试！')
      }
    }
  }

  /**
   * 获取用户信息
   * @param {boolean} isDebug
   * @returns {Promise<void>}
   */
  async handleUserMineData(isDebug = false) {
    if (!Keychain.contains('userMineData')) {
      if (!Keychain.contains('userBaseInfoData')) {
        return this.notify('获取密钥数据失败', '没有拿到用户登录信息，请重新登录再重试！')
      }
      const getUserBaseInfoData =JSON.parse(Keychain.get('userBaseInfoData'))
      const options = {
        url: AUDI_SERVER_API.mine,
        method: 'GET',
        headers: {
          ...{
            'X-ACCESS-TOKEN': getUserBaseInfoData.accessToken
          },
          ...REQUEST_HEADER
        }
      }
      const response = await this.http(options)
      if (isDebug) console.log('获取用户信息：')
      if (isDebug) console.log(response)
      // 判断接口状态
      if (response.code === 0) {
        // 存储车辆信息
        console.log('用户基本信息获取成功')
        Keychain.set('userMineData', JSON.stringify(response.data))
        Keychain.set('myCarVIN', response.data?.vehicleDto?.vin)
        // 准备交换验证密钥数据
        await this.handleAudiGetToken('userRefreshToken')
      } else {
        // 获取异常
        await this.notify('个人信息获取失败', '请稍后重新登录再重试！')
      }
    } else {
      console.log('userMineData 信息已存在，开始获取 userRefreshToken')
      if (isDebug) console.log(Keychain.get('userMineData'))
      await this.handleAudiGetToken('userRefreshToken')
    }
  }

  /**
   * 获取密钥数据
   * @param {'userIDToken' | 'userRefreshToken'} type
   * @param {boolean} forceRefresh
   * @returns {Promise<void>}
   */
  async handleAudiGetToken(type, forceRefresh = false) {
    if (forceRefresh || !Keychain.contains(type)) {
      if (type === 'userIDToken' && !Keychain.contains('userBaseInfoData')) {
        return this.notify('获取密钥数据失败', '没有拿到用户登录信息，请重新登录再重试！')
      }
      if (type === 'userRefreshToken' && !Keychain.contains('userIDToken')) {
        return this.notify('获取密钥数据失败', '没有拿到用户 ID Token，请重新登录再重试！')
      }

      // 根据交换token请求参数不同
      let requestParams = ''
      const getUserBaseInfoData =JSON.parse(Keychain.get('userBaseInfoData'))
      if (type === 'userIDToken') {
        requestParams = `grant_type=${encodeURIComponent('id_token')}&token=${encodeURIComponent(getUserBaseInfoData.idToken)}&scope=${encodeURIComponent('sc2:fal')}`
      } else if (type === 'userRefreshToken') {
        const getUserIDToken =JSON.parse(Keychain.get('userIDToken'))
        requestParams = `grant_type=${encodeURIComponent('refresh_token')}&token=${encodeURIComponent(getUserIDToken.refresh_token)}&scope=${encodeURIComponent('sc2:fal')}&vin=${Keychain.get('myCarVIN')}`
      }

      const options = {
        url: AUDI_SERVER_API.token,
        method: 'POST',
        headers: {
          'X-Client-ID': 'de6d8b23-792f-47b8-82f4-e4cc59c2916e',
          'User-Agent': 'MyAuDi/3.0.2 CFNetwork/1325.0.1 Darwin/21.1.0',
        },
        body: requestParams
      }
      const response = await this.http(options)
      // 判断接口状态
      if (response.error) {
        switch (response.error) {
          case 'invalid_grant':
            await this.notify('IDToken 数据过期', '正在重新获取数据中，请耐心等待...')
            await this.handleAudiGetToken('userIDToken', true)
            break
        }
      } else {
        // 获取密钥数据成功，存储数据
        Keychain.set(type, JSON.stringify(response))
        console.log('当前密钥数据获取成功：' + type)
        if (type === 'userRefreshToken') {
          Keychain.set('authToken', response.access_token)
          console.log('authToken 密钥设置成功')
          // 正式获取车辆信息
          await this.bootstrap()
        }
      }
    } else {
      // 已存在的时候
      console.log(type + ' 信息已存在，开始 bootstrap() 函数')
      if (type === 'userRefreshToken') await this.bootstrap()
    }
  }

  /**
   * 获取车辆当前状态
   * 需要实时获取
   * @param {boolean} isDebug
   * @returns {Promise<void>}
   */
  async handleVehiclesStatus(isDebug = false) {
    if (!Keychain.contains('authToken')) {
      return this.notify('获取 authToken 密钥失败', '请退出登录再登录重试！')
    }
    if (!Keychain.contains('myCarVIN')) {
      return this.notify('获取 myCarVIN 数据失败', '请退出登录再登录重试！')
    }
    const options = {
      url: AUDI_SERVER_API.vehiclesStatus(Keychain.get('myCarVIN')),
      method: 'GET',
      headers: {
        ...{
          'Authorization': 'Bearer ' + Keychain.get('authToken'),
          'X-App-Name': 'MyAuDi',
          'X-App-Version': '113',
          'Accept-Language': 'de-DE'
        },
        ...REQUEST_HEADER
      }
    }
    const response = await this.http(options)
    if (isDebug) console.log('获取车辆状态信息：')
    if (isDebug) console.log(response)
    // 判断接口状态
    if (response.error) {
      // 接口异常
      console.log('vehiclesStatus 接口异常' + response.error.errorCode + ' - ' + response.error.description)
      switch (response.error.errorCode) {
        case 'gw.error.authentication':
          console.log('获取车辆状态失败 error: ' + response.error.errorCode)
          await this.handleAudiGetToken('userRefreshToken', true)
          await this.handleVehiclesStatus()
          break
      }
    } else {
      // 接口获取数据成功
      return response
    }
  }

  /**
   * 获取车辆当前经纬度
   * 需要实时获取
   * @param {boolean} isDebug
   * @returns {Promise<string>}
   */
  async handleVehiclesPosition(isDebug = false) {
    if (!Keychain.contains('authToken')) {
      await this.notify('获取 authToken 密钥失败', '请退出登录再登录重试！')
      return Keychain.get('carPosition')
    }
    if (!Keychain.contains('myCarVIN')) {
      await this.notify('获取 myCarVIN 数据失败', '请退出登录再登录重试！')
      return Keychain.get('carPosition')
    }
    const options = {
      url: AUDI_SERVER_API.vehiclesPosition(Keychain.get('myCarVIN')),
      method: 'GET',
      headers: {
        ...{
          'Authorization': 'Bearer ' + Keychain.get('authToken'),
          'X-App-Name': 'MyAuDi',
          'X-App-Version': '113',
          'Accept-Language': 'de-DE'
        },
        ...REQUEST_HEADER
      }
    }
    try {
      const response = await this.http(options)
      if (isDebug) console.log('获取车辆位置信息：')
      if (isDebug) console.log(response)
      // 判断接口状态
      if (response.error) {
        // 接口异常
        console.log('vehiclesPosition 接口异常' + response.error.errorCode + ' - ' + response.error.description)
        switch (response.error.errorCode) {
          case 'gw.error.authentication':
            await this.notify('获取车辆位置失败 error: ' + response.error.errorCode)
            await this.handleAudiGetToken('userRefreshToken', true)
            await this.handleVehiclesPosition()
            break
        }
      } else {
        // 接口获取数据成功储存接口数据
        if (response.storedPositionResponse) {
          Keychain.set('storedPositionResponse', JSON.stringify(response))
          Keychain.set('carPosition', JSON.stringify({
            longitude: response.storedPositionResponse.position.carCoordinate.longitude,
            latitude: response.storedPositionResponse.position.carCoordinate.latitude
          }))
        } else if (response.findCarResponse) {
          Keychain.set('findCarResponse', JSON.stringify(response))
          Keychain.set('carPosition', JSON.stringify({
            longitude: response.findCarResponse.Position.carCoordinate.longitude,
            latitude: response.findCarResponse.Position.carCoordinate.latitude
          }))
        }
        return Keychain.get('carPosition')
      }
    } catch (error) {
      console.log('vehiclesPosition 接口捕获异常：' + error)
      // 如果出现异常说明 当前车辆处于运行状态或者车辆没有上传位置信息
      if (Keychain.contains('carPosition')) {
        return Keychain.get('carPosition')
      } else {
        return JSON.stringify({
          longitude: -1,
          latitude: -1
        })
      }
    }
  }

  /**
   * 获取车辆地址
   * @returns {Promise<string>}
   */
  async handleGetCarAddress() {
    if (!Keychain.contains('storedPositionResponse') && !Keychain.contains('carPosition')) {
      await this.notify('获取车辆经纬度失败', '请退出登录再登录重试！')
      return '暂无位置信息'
    }
    const carPosition = JSON.parse(Keychain.get('carPosition'))
    const longitude = parseInt(carPosition.longitude, 10) / 1000000
    const latitude = parseInt(carPosition.latitude, 10) / 1000000

    // longitude latitude 可能会返回负数的问题
    // 直接返回缓存数据
    if (longitude < 0 || latitude < 0) return '暂无位置信息'

    const aMapKey = this.settings['aMapKey'] ? this.settings['aMapKey'] : AUDI_AMAP_KEY
    const options = {
      url: `https://restapi.amap.com/v3/geocode/regeo?key=${aMapKey}&location=${longitude},${latitude}&radius=1000&extensions=base&batch=false&roadlevel=0`,
      method: 'GET'
    }
    const response = await this.http(options)
    if (response.status === '1') {
      // const address = response.regeocode.formatted_address
      const addressComponent = response.regeocode.addressComponent
      const address = addressComponent.city + addressComponent.district + addressComponent.township
      Keychain.set('carAddress', address)
      return address
    } else {
      await this.notify('获取车辆位置失败', '请检查高德地图 key 是否填写正常')
      if (Keychain.contains('carAddress')) {
        return Keychain.get('carAddress')
      } else {
        return '暂无位置信息'
      }
    }
  }

  /**
   * 组件声明
   * @returns {Promise<void>}
   */
  async actionStatementSettings () {
    const alert = new Alert()
    alert.title = '组件声明'
    alert.message = `
    小组件需要使用到您的一汽大众应用的账号，首次登录请配置账号、密码进行令牌获取\n\r
    小组件不会收集您的个人账户信息，所有账号信息将存在 iCloud 或者 iPhone 上但也请您妥善保管自己的账号\n\r
    小组件是开源、并且完全免费的，由奥迪车主开发，所有责任与一汽奥迪公司无关\n\r
    开发者: 淮城一只猫\n\r
    温馨提示：由于一汽奥迪应用支持单点登录，即不支持多终端应用登录，建议在一汽奥迪应用「用车 - 更多功能 - 用户管理」进行添加用户，这样组件和应用独立执行。
    `
    alert.addAction('同意')
    alert.addCancelAction('不同意')
    const id = await alert.presentAlert()
    if (id === -1) return
    await this.actionAccountSettings()
  }

  /**
   * 设置账号数据
   * @returns {Promise<void>}
   */
  async actionAccountSettings() {
    const alert = new Alert()
    alert.title = '一汽奥迪账户登录'
    alert.message = '登录一汽奥迪账号展示车辆数据'
    alert.addTextField('一汽奥迪账号', this.settings['username'])
    alert.addTextField('一汽奥迪密码', this.settings['password'])
    alert.addAction('确定')
    alert.addCancelAction('取消')

    const id = await alert.presentAlert()
    if (id === -1) return
    this.settings['username'] = alert.textFieldValue(0)
    this.settings['password'] = alert.textFieldValue(1)
    this.saveSettings()
    console.log('开始进行用户登录')
    await this.handleAudiLogin()
  }

  /**
   * 个性化配置
   * @returns {Promise<void>}
   */
  async actionPreferenceSettings () {
    const alert = new Alert()
    alert.title = '组件个性化配置'
    alert.message = '根据您的喜好设置，更好展示组件数据'

    const menuList = [{
      name: 'myCarPhoto',
      text: '车辆照片',
      icon: '🚙'
    }, {
      name: 'myOne',
      text: '一言',
      icon: '📝'
    }, {
      name: 'lightBgColor',
      text: '浅色背景色',
      icon: '🌕'
    }, {
      name: 'darkBgColor',
      text: '深色背景色',
      icon: '🌑'
    }, {
      name: 'aMapKey',
      text: '高德地图 Key',
      icon: '🎯'
    }]

    menuList.forEach(item => {
      alert.addAction(item.icon + ' ' +item.text)
    })

    alert.addCancelAction('取消设置')
    const id = await alert.presentSheet()
    if (id === -1) return
    await this['actionPreferenceSettings' + id]()
  }

  /**
   * 使用在线图片服务地址
   * @returns {Promise<void>}
   */
  async actionPreferenceSettings0() {
    const alert = new Alert()
    alert.title = '车辆图片'
    alert.message = '请输入车辆在线图片，如果有素材想使用请联系作者或者请看帮助文档说明\n\r' +
      '不填写使用默认图片'
    alert.addTextField('请输入地址', this.settings['myCarPhoto'])
    alert.addAction('确定')
    alert.addCancelAction('取消')

    const id = await alert.presentAlert()
    if (id === -1) return await this.actionPreferenceSettings()
    const value = alert.textFieldValue(0)
    if (!value) {
      this.settings['myCarPhoto'] = DEFAULT_MY_CAR_PHOTO
      this.saveSettings()
      return await this.actionPreferenceSettings()
    }

    this.settings['myCarPhoto'] = value
    this.saveSettings()

    return await this.actionPreferenceSettings()
  }

  /**
   * 输入一言
   * @returns {Promise<void>}
   */
  async actionPreferenceSettings1() {
    const alert = new Alert()
    alert.title = '输入一言'
    alert.message = '请输入一言，将会在桌面展示语句，不填则显示 "世间美好，与你环环相扣"'
    alert.addTextField('请输入一言', this.settings['myOne'])
    alert.addAction('确定')
    alert.addCancelAction('取消')

    const id = await alert.presentAlert()
    if (id === -1) return await this.actionPreferenceSettings()
    const value = alert.textFieldValue(0)
    if (!value) return await this.actionPreferenceSettings1()

    this.settings['myOne'] = value
    this.saveSettings()

    return await this.actionPreferenceSettings()
  }

  /**
   * 浅色模式
   * @returns {Promise<void>}
   */
  async actionPreferenceSettings2() {
    const alert = new Alert()
    alert.title = '浅色模式颜色代码'
    alert.message = '如果都输入相同的颜色代码小组件则是纯色背景色，如果是不同的代码则是渐变背景色，不填写采取默认背景色\n\r默认颜色代码：' + DEFAULT_LIGHT_BACKGROUND_COLOR_1 + ' 和 ' + DEFAULT_LIGHT_BACKGROUND_COLOR_2
    alert.addTextField('颜色代码一', this.settings['lightBgColor1'])
    alert.addTextField('颜色代码二', this.settings['lightBgColor2'])
    alert.addAction('确定')
    alert.addCancelAction('取消')

    const id = await alert.presentAlert()
    if (id === -1) return await this.actionPreferenceSettings()
    const lightBgColor1 = alert.textFieldValue(0)
    const lightBgColor2 = alert.textFieldValue(1)

    this.settings['lightBgColor1'] = lightBgColor1
    this.settings['lightBgColor2'] = lightBgColor2
    this.saveSettings()

    return await this.actionPreferenceSettings()
  }

  /**
   * 深色模式
   * @returns {Promise<void>}
   */
  async actionPreferenceSettings3() {
    const alert = new Alert()
    alert.title = '深色模式颜色代码'
    alert.message = '如果都输入相同的颜色代码小组件则是纯色背景色，如果是不同的代码则是渐变背景色，不填写采取默认背景色\n\r默认颜色代码：' + DEFAULT_DARK_BACKGROUND_COLOR_1 + ' 和 ' + DEFAULT_DARK_BACKGROUND_COLOR_2
    alert.addTextField('颜色代码一', this.settings['darkBgColor1'])
    alert.addTextField('颜色代码二', this.settings['darkBgColor2'])
    alert.addAction('确定')
    alert.addCancelAction('取消')

    const id = await alert.presentAlert()
    if (id === -1) return await this.actionPreferenceSettings()
    const darkBgColor1 = alert.textFieldValue(0)
    const darkBgColor2 = alert.textFieldValue(1)

    this.settings['darkBgColor1'] = darkBgColor1
    this.settings['darkBgColor2'] = darkBgColor2
    this.saveSettings()

    return await this.actionPreferenceSettings()
  }

  /**
   * 高德地图Key
   * @returns {Promise<void>}
   */
  async actionPreferenceSettings4() {
    const alert = new Alert()
    alert.title = '高德地图 Key'
    alert.message = '请输入组件所需要的高德地图 key 用于车辆逆地理编码以及地图资源\n\r获取途径可以在「关于小组件」菜单里加微信群进行咨询了解'
    alert.addTextField('key 密钥', this.settings['aMapKey'])
    alert.addAction('确定')
    alert.addCancelAction('取消')

    const id = await alert.presentAlert()
    if (id === -1) return await this.actionPreferenceSettings()
    this.settings['aMapKey'] = alert.textFieldValue(0)
    this.saveSettings()

    return await this.actionPreferenceSettings()
  }

  /**
   * 登出系统
   * @returns {Promise<void>}
   */
  async actionLogOut() {
    const alert = new Alert()
    alert.title = '退出账号'
    alert.message = '您所登录的账号包括缓存本地的数据将全部删除，请慎重操作。'
    alert.addAction('登出')
    alert.addCancelAction('取消')

    const id = await alert.presentAlert()
    if (id === -1) return await this.actionPreferenceSettings()

    const keys = [
      'userBaseInfoData',
      'defaultVehicleData',
      'userMineData',
      'myCarVIN',
      'authToken',
      'userIDToken',
      'userRefreshToken',
      'storedPositionResponse',
      'findCarResponse',
      'carPosition',
      'carAddress',
      this.SETTING_KEY
    ]
    keys.forEach(key => {
      if (Keychain.contains(key)) {
        Keychain.remove(key)
        console.log(key + ' 缓存信息已删除')
      }
    })
    await this.notify('登出成功', '敏感信息已全部删除')
  }

  /**
   * 点击检查更新操作
   * @returns {Promise<void>}
   */
  async actionCheckUpdate() {
    const UPDATE_FILE = 'Audi-Joiner.js'
    const FILE_MGR = FileManager[module.filename.includes('Documents/iCloud~') ? 'iCloud' : 'local']()
    const request = new Request('https://gitee.com/JaxsonWang/scriptable-audi/raw/master/version.json')
    const response = await request.loadJSON()
    console.log(`远程版本：${response['version']}`)
    if (response['version'] === AUDI_VERSION) return this.notify('无需更新', '远程版本一致，暂无更新')
    console.log('发现新的版本')

    const log = response['changelog'].join('\n')
    const alert = new Alert()
    alert.title = '更新提示'
    alert.message = `是否需要升级到${response['version'].toString()}版本\n\r${log}`
    alert.addAction('更新')
    alert.addCancelAction('取消')
    const id = await alert.presentAlert()
    if (id === -1) return
    await this.notify('正在更新中...')
    const REMOTE_REQ = new Request(response['download'])
    const REMOTE_RES = await REMOTE_REQ.load()
    FILE_MGR.write(FILE_MGR.joinPath(FILE_MGR.documentsDirectory(), UPDATE_FILE), REMOTE_RES)

    await this.notify('Audi 桌面组件更新完毕！')
  }

  async actionDonation() {
    Safari.open( 'https://audi.i95.me/donation.html')
  }

  /**
   * 关于组件
   * @returns {Promise<void>}
   */
  async actionAbout() {
    Safari.open( 'https://audi.i95.me/about.html')
  }

  /**
   * 日志系统
   * @return {Promise<void>}
   */
  async actionLogAction() {
    const alert = new Alert()
    alert.title = '获取函数日志'
    alert.message = '开发者所需日志数据'

    const menuList = [{
      name: 'handleAudiLogin',
      text: '登陆日志'
    }, {
      name: 'handleUserMineData',
      text: '用户信息日志'
    }, {
      name: 'handleVehiclesStatus',
      text: '当前车辆状态日志'
    }, {
      name: 'handleVehiclesPosition',
      text: '车辆经纬度日志'
    }, {
      name: 'getDeviceInfo',
      text: '获取设备信息'
    }]

    menuList.forEach(item => {
      alert.addAction(item.text)
    })

    alert.addCancelAction('退出菜单')
    const id = await alert.presentSheet()
    if (id === -1) return
    // 执行函数
    await this[menuList[id].name](true)
  }

  /**
   * 获取设备信息
   * @return {Promise<void>}
   */
  async getDeviceInfo() {
    console.log('当前系统:' + Device.model() + ' ' + Device.systemName() + ' ' + Device.systemVersion())
    console.log('屏幕尺寸宽:' + Device.screenSize().width + ', 高:' + Device.screenSize().height)
    console.log('屏幕分辨率宽:' + Device.screenResolution().width + ', 高:' + Device.screenResolution().height)
    console.log('屏幕比例:' + Device.screenScale())
  }

  /**
   * 自定义注册点击事件，用 actionUrl 生成一个触发链接，点击后会执行下方对应的 action
   * @param {string} url 打开的链接
   */
  async actionOpenUrl(url) {
    await Safari.openInApp(url, false)
  }

  /**
   * 分割字符串
   * @param str
   * @param num
   * @returns {*[]}
   */
  splitStr2Arr(str, num) {
    const strArr = []
    for (let i = 0, l = str.length; i < l / num; i++) {
      const string = str.slice(num * i, num * (i + 1))
      strArr.push(string)
    }

    return strArr
  }
}


await Running(Widget)
