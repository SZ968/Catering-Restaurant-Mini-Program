const { BRAND, PHONES, SHOP_ADDRESS, MAP_SEARCH_NAME, SHOP_LOCATION } = require('../../utils/config')
const shopSvc = require('../../services/shop')
const contentSvc = require('../../services/content')

// 首页模块缺省配置：数据库未初始化/读取出错时，仍按设计渲染完整页面
const DEFAULT_MODULES = [
  { _id: 'default-hero', type: 'hero', title: '品牌轮播', visible: true, sort: 1 },
  { _id: 'default-business', type: 'business', title: '营业状态', visible: true, sort: 2 },
  { _id: 'default-services', type: 'services', title: '核心服务', visible: true, sort: 3 },
  { _id: 'default-address', type: 'address', title: '门店地址', visible: true, sort: 4 },
  { _id: 'default-announcements', type: 'announcements', title: '门店公告', visible: true, sort: 5 },
  { _id: 'default-merchant', type: 'merchant', title: '商家管理入口', visible: true, sort: 6 },
]

Page({
  data: {
    statusBarHeight: 20,
    activeIndex: 1,
    homeMounted: true,
    heroImages: [],
    brandName: BRAND.name,
    slogan: BRAND.slogan,
    isOpen: true,
    hoursText: '',
    notice: '',
    phones: PHONES,
    address: SHOP_ADDRESS,
    mapName: MAP_SEARCH_NAME,
    latitude: SHOP_LOCATION.latitude,
    longitude: SHOP_LOCATION.longitude,
    announcements: [],
    hasAnnouncements: false,
    modules: DEFAULT_MODULES,
  },

  onLoad() {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    this.setData({ statusBarHeight: info.statusBarHeight || 20 })
    this.loadShop()
    this.loadStatus()
    this.loadBanners()
    this.loadAnnouncements()
    this.loadModules()
    // 后台修改轮播图/公告时实时同步到用户端
    this._bannerWatcher = contentSvc.watchBanners((list) => {
      this.setData({ heroImages: list || [] })
    })
    this._annWatcher = contentSvc.watchAnnouncements((list) => {
      this.setData({ announcements: list, hasAnnouncements: list.length > 0 })
    })
    // 后台调整首页模块顺序/显隐时实时同步
    this._modWatcher = contentSvc.watchPageModules((list) => {
      this._applyModules(list.filter((m) => m.visible !== false))
    })
  },

  onShow() {
    // 回到首页（中间屏）时确保模块已挂载并重拉数据
    if (this.data.activeIndex === 1) {
      this.setData({ homeMounted: true })
      this.loadStatus()
      this.loadBanners()
      this.loadAnnouncements()
      this.loadModules()
    }
  },

  onHide() {
    this.setData({ homeMounted: false })
  },

  // 读取首页模块配置，按 sort 升序、可见过滤，并为非 hero 模块计算入场动画延迟
  async loadModules() {
    try {
      const list = await contentSvc.getPageModules()
      this._applyModules(list)
    } catch (e) {
      console.error('loadModules', e)
    }
  },

  _applyModules(list) {
    // 数据库集合不存在或为空时，使用默认模块兜底，避免白屏只剩电话按钮
    const effective = (list && list.length ? list : DEFAULT_MODULES)
    const sorted = effective.slice().sort((a, b) => (a.sort || 0) - (b.sort || 0))
    sorted.forEach((m, i) => {
      // hero 模块不参与位移动画（避免顶部留白），其余模块交错淡入
      m._delay = m.type === 'hero' ? 0 : (i * 0.07).toFixed(2)
    })
    this.setData({ modules: sorted })
  },

  onUnload() {
    if (this._bannerWatcher && this._bannerWatcher.close) this._bannerWatcher.close()
    if (this._annWatcher && this._annWatcher.close) this._annWatcher.close()
    if (this._modWatcher && this._modWatcher.close) this._modWatcher.close()
  },

  // 顶部 Tab 点击切换
  goTab(e) {
    const i = Number(e.currentTarget.dataset.i)
    if (i === this.data.activeIndex) return
    this.setData({ activeIndex: i })
  },

  // 左右滑动切换：保留首页动态模块功能（切回首页时重播入场动画）
  onSwiperChange(e) {
    const i = e.detail.current
    this.setData({ activeIndex: i })
    if (i === 1) {
      // 先卸载再挂载，强制重播交错淡入动画
      this.setData({ homeMounted: false })
      setTimeout(() => {
        this.setData({ homeMounted: true })
        this.loadStatus()
        this.loadBanners()
        this.loadAnnouncements()
        this.loadModules()
      }, 30)
    } else {
      this.setData({ homeMounted: false })
    }
  },

  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/login/login' })
  },

  async loadShop() {
    try {
      const info = await shopSvc.getShopInfo()
      this.setData({
        brandName: info.name || BRAND.name,
        slogan: info.slogan || BRAND.slogan,
        address: info.address || SHOP_ADDRESS,
        phones: info.phones && info.phones.length ? info.phones : PHONES,
        mapName: info.mapSearchName || MAP_SEARCH_NAME,
        latitude: info.latitude || SHOP_LOCATION.latitude,
        longitude: info.longitude || SHOP_LOCATION.longitude,
      })
    } catch (e) {
      console.error('loadShop', e)
    }
  },

  async loadStatus() {
    try {
      const s = await shopSvc.getBusinessStatus()
      this.setData({ isOpen: s.isOpen, hoursText: s.hoursText, notice: s.notice })
    } catch (e) {
      console.error('loadStatus', e)
    }
  },

  async loadBanners() {
    try {
      const banners = await contentSvc.getBanners()
      this.setData({ heroImages: banners || [] })
    } catch (e) {
      console.error('loadBanners', e)
      this.setData({ heroImages: [] })
    }
  },

  async loadAnnouncements() {
    try {
      const list = await contentSvc.getAnnouncements()
      this.setData({ announcements: list, hasAnnouncements: list.length > 0 })
    } catch (e) {
      console.error('loadAnnouncements', e)
    }
  },

  goRules() {
    wx.navigateTo({ url: '/pages/rules/rules' })
  },
  goMap() {
    wx.navigateTo({ url: '/pages/map/map' })
  },
  goContact() {
    wx.navigateTo({ url: '/pages/contact/contact' })
  },
})
