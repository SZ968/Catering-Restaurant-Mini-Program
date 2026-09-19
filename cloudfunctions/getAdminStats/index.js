const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 管理端首页概览（仅管理员）：轮播图数 / 公告数 / 营业状态
exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  const admin = await db.collection('res_admins').where({ openid: OPENID }).get()
  if (!admin.data || !admin.data.length) {
    return { success: false, message: '无权限', stats: {} }
  }

  const [banners, announcements, biz, modules] = await Promise.all([
    db.collection('res_banners').where({ isActive: true }).count(),
    db.collection('res_announcements').where({ isActive: true }).count(),
    db.collection('res_business_status').doc('singleton').get(),
    db.collection('res_page_modules').where({ visible: true }).count(),
  ])

  const isOpen = biz.data ? !!biz.data.isOpen : true
  return {
    success: true,
    stats: {
      bannerCount: banners.total || 0,
      announcementCount: announcements.total || 0,
      moduleCount: modules.total || 0,
      isOpen,
      statusText: isOpen ? '营业中' : '休息中',
    },
  }
}
