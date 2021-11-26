// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: car;
//
// iOS 桌面组件脚本
// 开发说明：请从 Widget 类开始编写，注释请勿修改
//

// 添加require，是为了vscode中可以正确引入包，以获得自动补全等功能
if (typeof require === 'undefined') require = importModule
const { Base, Testing } = require('./depend')

// @组件代码开始
const AUDI_SERVER_API = {
  login: 'https://audi2c.faw-vw.com/capi/v1/user/login',
  token: 'https://mbboauth-1d.prd.cn.vwg-connect.cn/mbbcoauth/mobile/oauth2/v1/token',
  mine: 'https://audi2c.faw-vw.com/capi/v1/user/mine',
  vehiclesStatus: vin => `https://mal-1a.prd.cn.vwg-connect.cn/api/bs/vsr/v1/vehicles/${vin}/status`,
  vehiclesPosition: vin => `https://mal-1a.prd.cn.vwg-connect.cn/api/bs/cf/v1/vehicles/${vin}/position`
}
const REQUEST_HEADER = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': 'MyAuDi/3.0.2 CFNetwork/1325.0.1 Darwin/21.1.0',
  'X-Client-ID': 'de6d8b23-792f-47b8-82f4-e4cc59c2916e'
}
const DEFAULT_MY_CAR_PHOTO = 'https://gitee.com/JaxsonWang/scriptable-audi/raw/master/assets/cars/2020A4LB9_20211125.png'
const DEFAULT_AUDI_LOGO = 'https://gitee.com/JaxsonWang/scriptable-audi/raw/master/assets/images/audi-logo.png'
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
  status: 0, // 0 = 正常
  myOne: '世间美好，与你环环相扣'
}
const AUDI_AMAP_KEY = 'c078fb16379c25bc0aad8633d82cf1dd'

const DEFAULT_LIGHT_BACKGROUND_COLOR_1 = '#f1faf9'
const DEFAULT_LIGHT_BACKGROUND_COLOR_2 = '#F0F3E4'
const DEFAULT_DARK_BACKGROUND_COLOR_1 = '#203D49'
const DEFAULT_DARK_BACKGROUND_COLOR_2 = '#7B9EAA'

const AUDI_VERSION = 20211125.0

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
      this.registerAction('关于小组件', this.actionAbout)
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

    widget.addSpacer(20)

    const stack = widget.addStack()
    stack.spacing = 20
    stack.centerAlignContent()

    // region leftStack start
    const leftStack = stack.addStack()
    leftStack.layoutVertically()

    const _title = leftStack.addText(data.seriesName)
    _title.textOpacity = 1
    _title.font = Font.systemFont(18)
    leftStack.addSpacer(2)
    const _desc = leftStack.addText('Power: ' + data.modelShortName)
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
    this.splitStr2Arr(carLocation, 10).forEach(item => {
      const _location = leftStack.addText(item)
      _location.textOpacity = 0.75
      _location.font = Font.systemFont(12)
    })

    // endregion leftStack end

    // region rightStack start
    const rightStack = stack.addStack()
    rightStack.layoutVertically()

    const _audiLogo = rightStack.addImage(await this.getImageByUrl(DEFAULT_AUDI_LOGO))
    _audiLogo.imageSize = new Size(180, 25)
    _audiLogo.rightAlignImage()

    const _audiImage = rightStack.addImage(await this.getMyCarPhoto())
    _audiImage.imageSize = new Size(180, 80)
    _audiImage.applyFillingContentMode()
    _audiImage.rightAlignImage()
    rightStack.addSpacer(5)
    // endregion rightStack end

    // region leftBottomStack
    // 车辆状态
    const rightBottomStack = rightStack.addStack()
    // 间隔居中
    const rightBottomStack1 = rightBottomStack.addStack()
    rightBottomStack1.addSpacer(35)

    const rightBottomStack2 = rightBottomStack.addStack()
    const getCarStatus = data.status === 0 ? '当前车辆状态：正常' : '后右门没锁'
    const _audiStatus = rightBottomStack2.addText(getCarStatus)
    _audiStatus.font = Font.systemFont(12)
    _audiStatus.textOpacity = 0.75
    _audiStatus.centerAlignText()
    // endregion

    // 祝语
    widget.addSpacer(5)
    const _tips = widget.addText(data.myOne)
    _tips.textOpacity = 1
    _tips.font = Font.systemFont(12)
    _tips.centerAlignText()
    widget.addSpacer(15)

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

    const text = widget.addText('欢迎使用 Audi iOS 桌面组件')
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
    const getUserMineData = JSON.parse(Keychain.get('userMineData'))
    const getVehicleData = getUserMineData.vehicleDto
    const getVehiclesStatus = await this.handleVehiclesStatus()
    const getVehiclesStatusArr = getVehiclesStatus.StoredVehicleDataResponse.vehicleData.data
    const getVehiclesPosition = JSON.parse(await this.handleVehiclesPosition())
    const getVehiclesAddress = await this.handleGetCarAddress()

    const getCarStatusArr = getVehiclesStatusArr.find(i => i.id === '0x0301FFFFFF').field
    const enduranceVal = getCarStatusArr.find(i => i.id === '0x0301030005').value // 燃料总行程
    const fuelLevelVal = getCarStatusArr.find(i => i.id === '0x030103000A').value // 燃料百分比
    const mileageVal = getVehiclesStatusArr.find(i => i.id === '0x0101010002').field[0].value // 总里程
    // 写入信息
    if (getVehicleData.seriesName) GLOBAL_USER_DATA.seriesName = getVehicleData.seriesName // 车辆型号
    if (getVehicleData.carModelName) GLOBAL_USER_DATA.modelShortName = getVehicleData.carModelName // 车辆功率类型
    if (getVehicleData.vin) GLOBAL_USER_DATA.vin = getVehicleData.vin // 车架号
    if (getVehicleData.engineNo) GLOBAL_USER_DATA.engineNo = getVehicleData.engineNo // 发动机型号
    if (getVehicleData.plateNo) GLOBAL_USER_DATA.plateNo = getVehicleData.plateNo // 车牌号
    if (enduranceVal) GLOBAL_USER_DATA.endurance = enduranceVal // NEDC 续航 单位 km
    if (fuelLevelVal) GLOBAL_USER_DATA.fuelLevel = fuelLevelVal // 燃料 单位百分比
    if (mileageVal) GLOBAL_USER_DATA.mileage = mileageVal // 总里程
    if (getVehiclesAddress) GLOBAL_USER_DATA.carLocation = getVehiclesAddress // 详细地理位置
    if (getVehiclesPosition.longitude) GLOBAL_USER_DATA.longitude = getVehiclesPosition.longitude // 车辆经度
    if (getVehiclesPosition.latitude) GLOBAL_USER_DATA.latitude = getVehiclesPosition.latitude // 车辆纬度
    // if (this.settings['myOne']) GLOBAL_USER_DATA.status = 0 // 车辆状态 0 = 正常
    if (this.settings['myOne']) GLOBAL_USER_DATA.myOne = this.settings['myOne'] // 一言

    return GLOBAL_USER_DATA
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
    if (this.settings['myCarPhoto'] && FileManager.local().fileExists(this.settings['myCarPhoto'])) myCarPhoto = Image.fromFile(this.settings['myCarPhoto'])
    return myCarPhoto
  }

  /**
   * 登录奥迪服务器
   * @returns {Promise<void>}
   */
  async handleAudiLogin() {
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
      // 判断接口状态
      if (response.code === 0) {
        // 登录成功 存储登录信息
        Keychain.set('userBaseInfoData', JSON.stringify(response.data))
        console.log('用户登录成功')
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
   * @returns {Promise<void>}
   */
  async handleUserMineData() {
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
      // 判断接口状态
      if (response.code === 0) {
        // 存储车辆信息
        Keychain.set('userMineData', JSON.stringify(response.data))
        Keychain.set('myCarVIN', response.data?.vehicleDto?.vin)
        console.log('车辆基本信息获取成功')
        // 准备交换验证密钥数据
        await this.handleAudiGetToken('userRefreshToken')
      } else {
        // 获取异常
        await this.notify('个人信息获取失败', '请稍后重新登录再重试！')
      }
    } else {
      console.log('userMineData 信息已存在，开始获取 userRefreshToken')
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
   * @returns {Promise<void>}
   */
  async handleVehiclesStatus() {
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
    // 判断接口状态
    if (response.error) {
      // 接口异常
      console.log('vehiclesStatus 接口异常' + response.error.errorCode + ' - ' + response.error.description)
      switch (response.error.errorCode) {
        case 'gw.error.authentication':
          await this.notify('获取车辆状态失败 error: ' + response.error.errorCode)
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
   * @returns {Promise<string>}
   */
  async handleVehiclesPosition() {
    if (!Keychain.contains('authToken')) {
      return this.notify('获取 authToken 密钥失败', '请退出登录再登录重试！')
    }
    if (!Keychain.contains('myCarVIN')) {
      return this.notify('获取 myCarVIN 数据失败', '请退出登录再登录重试！')
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
        return undefined
      }
    }
  }

  /**
   * 获取车辆地址
   * @returns {Promise<string>}
   */
  async handleGetCarAddress() {
    if (!Keychain.contains('storedPositionResponse') && !Keychain.contains('carPosition')) {
      return this.notify('获取车辆经纬度失败', '请退出登录再登录重试！')
    }
    const carPosition = JSON.parse(Keychain.get('carPosition'))
    const longitude = parseInt(carPosition.longitude, 10) / 1000000
    const latitude = parseInt(carPosition.latitude, 10) / 1000000
    const aMapKey = this.settings['aMapKey'] ? this.settings['aMapKey'] : AUDI_AMAP_KEY
    const options = {
      url: `https://restapi.amap.com/v3/geocode/regeo?key=${aMapKey}&location=${longitude},${latitude}&radius=1000&extensions=base&batch=false&roadlevel=0`,
      method: 'GET'
    }
    const response = await this.http(options)
    if (response.status === '1') {
      Keychain.set('carAddress', response.regeocode.formatted_address)
      return response.regeocode.formatted_address
    } else {
      this.notify('获取车辆位置失败', '请检查高德地图 key 是否填写正常')
      if (Keychain.contains('carAddress')) {
        return Keychain.get('carAddress')
      } else {
        Keychain.set('carAddress', '暂无车辆详细位置信息')
        return Keychain.get('carAddress')
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
      alert.addAction(item.icon + item.text)
    })

    alert.addCancelAction('取消设置')
    const id = await alert.presentSheet()
    if (id === -1) return
    await this['actionPreferenceSettings' + id]()
  }

  /**
   * 从相册选择图片
   * @returns {Promise<void>}
   */
  async actionPreferenceSettings0() {
    const image = await Photos.fromLibrary()
    const filePath = FileManager.local().joinPath(FileManager.local().temporaryDirectory(), 'myCarPhoto')
    FileManager.local().writeImage(filePath, image)
    this.settings['myCarPhoto'] = filePath
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
    const UPDATE_FILE = 'Audi.js'
    const FILE_MGR = FileManager[module.filename.includes('Documents/iCloud~') ? 'iCloud' : 'local']()
    const request = new Request('https://gitee.com/JaxsonWang/scriptable-audi/raw/master/version.json')
    const response = await request.loadJSON()
    console.log(`远程版本：${response['version']}`)
    if (response['version'] === AUDI_VERSION) return this.notify('无需更新', '远程版本一致，暂无更新')
    console.log('发现新的版本')

    const log = response['changelog'].join('\n')
    const alert = new Alert()
    alert.title = '更新提示'
    alert.message = `是否需要升级到${response['version']}版本\n\r${log}`
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

  /**
   * 关于组件
   * @returns {Promise<void>}
   */
  async actionAbout() {
    Safari.open( 'https://audi.i95.me/about')
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

// @组件代码结束
await Testing(Widget)
