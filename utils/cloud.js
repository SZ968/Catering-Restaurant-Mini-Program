// ============================================================
// 云数据库访问封装
// 集合统一加 res_ 前缀（见方案数据结构设计）
// ============================================================

const COLLECTIONS = {
  categories: 'res_categories',
  dishes: 'res_dishes',
  businessStatus: 'res_business_status',
  shopInfo: 'res_shop_info',
  materials: 'res_materials',
  orders: 'res_orders',
  admins: 'res_admins',
  banners: 'res_banners',
  announcements: 'res_announcements',
  pageModules: 'res_page_modules',
  moments: 'res_moments',
  reviews: 'res_reviews',
  adminApplications: 'res_admin_applications',
}

// 懒加载，避免在任何 wx.cloud.init 之前被调用
function getDB() {
  return wx.cloud.database()
}

function getCmd() {
  return wx.cloud.database().command
}

module.exports = { COLLECTIONS, getDB, getCmd }
