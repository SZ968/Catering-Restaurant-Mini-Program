# 猴王大虾 微信小程序 — 开发交付概览

> 按已确认方案（toasty-aurora-darwin.md）完整开发，技术栈：微信小程序原生 + 腾讯云开发 CloudBase。

## 已交付内容

### 顾客端（10 页）
- **首页** `pages/index`：居中品牌字「猴王大虾」+ 副标题「好吃的大虾会说话」，轮播门面图，营业状态横幅，快捷入口，左下角常驻拨号。
- **菜单** `pages/menu`：分类吸顶 Tab + 菜品卡片 + 实时 `watch()` 同步上下架/售罄 + 底部购物车悬浮条。
- **菜品详情** `pages/dish-detail`：大图、介绍、辣度规格选择、数量、口味备注、加入购物车。
- **购物车** `pages/cart`：数量调整、备注、删除、清空、合计。
- **结算** `pages/checkout`：堂食/自提/外卖/预订四种履约方式，校验后调 `createOrder` + 微信支付。
- **我的订单 / 订单详情** `pages/orders` `pages/order`：列表筛选、状态进度时间线、未支付订单重新支付。
- **食安公示** `pages/rules`：规章制度图片网格 + 大图预览。
- **地图** `pages/map` 与 **联系** `pages/contact`：电话拨号/复制、`wx.openLocation` 导航、地址与营业时间展示。

### 商家管理端（7 页，分包 `pages/admin`）
登录鉴权（OPENID 白名单）、经营概览、菜品上下架与新增、分类管理、营业状态/时段/外卖开关、订单接单-备餐-完成-取消、素材上传管理。

### 公共组件（8 个）
`contact-float` `business-banner` `category-tabs` `dish-card` `cart-bar` `stepper` `spec-selector` `order-status`

### 云函数（15 个）
getShopInfo / getBusinessStatus / createOrder / payNotify / queryOrder / getMyOrders / updateOrderStatus / getAdminStats / getAdminOrders / checkAdmin / manageDish / manageCategory / manageHours / manageMaterials / initData

### 设计系统
全程 `rpx` 适配，暖橙+朱红+焦糖棕+墨绿烟火气配色（CSS 变量定义在 `app.wxss`），衬线品牌字，禁用 emoji 图标。

## 需你后续补全的占位项
1. `miniprogram/utils/config.js` 的 `ENV_ID`（CloudBase 环境 ID）。
2. `cloudfunctions/createOrder/index.js` 的 `PAY_CONFIG.subMchId` 与 `envId`（微信支付云支付商户号）。
3. `project.config.json` 的 `appid`。
4. 将 10 张门店图片上传至云存储并写入对应集合（详见 README.md）。

## 上线前关键检查
- 数据库安全规则（读=公开、写=仅云函数）。
- 运行 `initData` 初始化数据与店主。
- 微信支付资质：营业执照 + 食品经营许可证。
