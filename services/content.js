// 首页内容服务：轮播图(banners) / 公告(announcements) / 模块配置(pageModules)
// / 商户动态(feed) / 评价(reviews)
// 由于数据库权限问题（云函数写入的数据客户端可能读不到），get 接口改为走公开云函数。
// watch 仍尝试客户端直连，作为管理端修改后的实时同步；若权限不足会走 onError，不影响页面显示。

const { getDB, COLLECTIONS } = require('../utils/cloud')

// 统一调用公开读取云函数
async function callPublic(type) {
  const res = await wx.cloud.callFunction({ name: 'getPublicContent', data: { type } })
  const r = (res && res.result) || {}
  if (!r.success) {
    throw new Error(r.message || '读取失败')
  }
  return r.list || []
}

// 读取启用的轮播图（按 sort 升序）
async function getBanners() {
  return callPublic('banners')
}

// 读取启用的公告（置顶优先，再按创建时间倒序）
async function getAnnouncements() {
  return callPublic('announcements')
}

// 读取首页可见模块（按 sort 升序），用于动态组装首页
async function getPageModules() {
  return callPublic('modules')
}

// 读取商户动态（图文流）
async function getMoments() {
  return callPublic('feed')
}

// 读取评价列表
async function getReviews() {
  return callPublic('reviews')
}

// 实时监听公告变化（管理端发布即时生效）
function watchAnnouncements(cb) {
  const db = getDB()
  return db.collection(COLLECTIONS.announcements).where({ isActive: true }).watch({
    onChange: (snapshot) => {
      const docs = (snapshot.docs || []).slice()
      docs.sort((a, b) => (b.pin === true) - (a.pin === true) || (b.createTime || 0) - (a.createTime || 0))
      cb(docs)
    },
    onError: (e) => console.error('watch announcements error', e),
  })
}

// 实时监听轮播图变化
function watchBanners(cb) {
  const db = getDB()
  return db.collection(COLLECTIONS.banners).where({ isActive: true }).watch({
    onChange: (snapshot) => {
      const docs = (snapshot.docs || []).slice().sort((a, b) => (a.sort || 0) - (b.sort || 0))
      cb(docs.map((b) => b.fileID).filter(Boolean))
    },
    onError: (e) => console.error('watch banners error', e),
  })
}

// 实时监听首页模块变化（管理端调整顺序/显隐即时生效）
function watchPageModules(cb) {
  const db = getDB()
  return db.collection(COLLECTIONS.pageModules).watch({
    onChange: (snapshot) => {
      const docs = (snapshot.docs || []).slice().sort((a, b) => (a.sort || 0) - (b.sort || 0))
      cb(docs)
    },
    onError: (e) => console.error('watch pageModules error', e),
  })
}

module.exports = {
  callPublic,
  getBanners,
  getAnnouncements,
  watchAnnouncements,
  watchBanners,
  getPageModules,
  watchPageModules,
  getMoments,
  getReviews,
}
