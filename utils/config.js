// ============================================================
// 全局配置：品牌、联系方式、地址、CloudBase 环境
// 注意：ENV_ID 必须替换为你自己的云开发环境 ID
// ============================================================

const BRAND = {
  name: '猴王大虾',
  slogan: '好吃的大虾会说话',
}

// 商家联系电话（点击直接拨号）
const PHONES = ['15136309816', '13526951858']

// 店铺地址与地图搜索名
const SHOP_ADDRESS = '洛阳市宜阳县锦屏镇二里庙'
const MAP_SEARCH_NAME = '猴王大虾(锦屏镇二里庙)'

// 默认经纬度（洛阳市宜阳县锦屏镇二里庙，腾讯地图坐标）
const SHOP_LOCATION = {
  latitude: 34.503826,
  longitude: 112.158683,
}

// CloudBase 环境 ID —— 已填入真实环境 ID
const ENV_ID = 'cloud1-d7gbq15ne65c36346'

// 是否启用微信支付：当前为 false（到店付模式），待资质齐全后改为 true
const ENABLE_PAY = false

// 订单类型中文映射
const ORDER_TYPE_TEXT = {
  dineIn: '堂食',
  takeout: '自提',
  delivery: '外卖',
  reserve: '预订',
}

// 订单状态中文映射
const ORDER_STATUS_TEXT = {
  unpaid: '待支付',
  paid: '已支付',
  preparing: '备餐中',
  done: '已完成',
  canceled: '已取消',
}

module.exports = {
  BRAND,
  PHONES,
  SHOP_ADDRESS,
  MAP_SEARCH_NAME,
  SHOP_LOCATION,
  ENV_ID,
  ENABLE_PAY,
  ORDER_TYPE_TEXT,
  ORDER_STATUS_TEXT,
}
