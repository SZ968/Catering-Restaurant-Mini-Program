const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 容错读取：集合不存在/读取出错时返回空列表，而不是整页报错
async function safeGet(collection, where, orderField, orderDir) {
  try {
    let q = db.collection(collection)
    if (where) q = q.where(where)
    if (orderField) q = q.orderBy(orderField, orderDir || 'asc')
    const res = await q.limit(100).get()
    return res.data || []
  } catch (e) {
    console.warn(`safeGet ${collection} failed:`, e.message || e)
    return []
  }
}

// 公开读取首页内容（轮播图、公告、模块配置、商户动态、评价）
// 用户端调用，无需管理员权限
exports.main = async (event) => {
  const { type } = event || {}

  if (type === 'banners') {
    const list = await safeGet('res_banners', { isActive: true }, 'sort', 'asc')
    return { success: true, list: list.map((b) => b.fileID).filter(Boolean) }
  }

  if (type === 'announcements') {
    const list = await safeGet('res_announcements', { isActive: true }, 'pin', 'desc')
    // 置顶优先，再按创建时间倒序
    list.sort((a, b) => (b.pin === true) - (a.pin === true) || (b.createTime || 0) - (a.createTime || 0))
    return { success: true, list }
  }

  if (type === 'modules') {
    const list = await safeGet('res_page_modules', { visible: true }, 'sort', 'asc')
    return { success: true, list }
  }

  if (type === 'feed') {
    const list = await safeGet('res_moments', { isActive: true }, 'createTime', 'desc')
    return { success: true, list }
  }

  if (type === 'reviews') {
    const list = await safeGet('res_reviews', { isActive: true }, 'createTime', 'desc')
    return { success: true, list }
  }

  // 默认全部返回
  const [banners, announcements, modules, feed, reviews] = await Promise.all([
    safeGet('res_banners', { isActive: true }, 'sort', 'asc'),
    safeGet('res_announcements', { isActive: true }, 'createTime', 'desc'),
    safeGet('res_page_modules', { visible: true }, 'sort', 'asc'),
    safeGet('res_moments', { isActive: true }, 'createTime', 'desc'),
    safeGet('res_reviews', { isActive: true }, 'createTime', 'desc'),
  ])

  return {
    success: true,
    banners: banners.map((b) => b.fileID).filter(Boolean),
    announcements,
    modules,
    feed,
    reviews,
  }
}
