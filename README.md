[README.md](https://github.com/user-attachments/files/32410057/README.md)
# 猴王大虾 · 微信小程序（CloudBase 云开发）

餐饮点单小程序：顾客端（品牌形象 / 菜单浏览 / 线上点单 / 微信支付 / 联系导航 / 食安公示）+ 商家管理端（菜品上下架 / 营业状态 / 订单处理 / 素材管理）。技术栈为**微信小程序原生 + 腾讯云开发 CloudBase**。

---

## 一、目录结构

```
小程序开发/
├─ project.config.json          # 项目配置（appid、云函数根目录等）
├─ miniprogram/                 # 小程序前端代码
│  ├─ app.js / app.json / app.wxss
│  ├─ pages/                    # 顾客端 10 页 + 管理端 7 页（pages/admin 分包）
│  ├─ components/               # 8 个公共组件
│  ├─ services/                 # 店铺/菜单数据服务
│  └─ utils/                    # 配置、云库封装、购物车、工具
└─ cloudfunctions/             # 15 个云函数（见下表）
```

## 二、部署前准备

1. **微信小程序 AppID**：在 `project.config.json` 将 `appid` 由 `touristappid` 改为你的真实 AppID。
2. **CloudBase 环境**：在微信开发者工具中开通云开发，记录环境 ID。
3. **替换环境 ID**：
   - `miniprogram/utils/config.js` 中的 `ENV_ID = 'your-env-id'`
   - `cloudfunctions/createOrder/index.js` 中 `PAY_CONFIG.envId`
4. **微信支付（云支付）**：在 CloudBase 控制台「云支付」中开通，并配置商户号，将 `createOrder` 的 `PAY_CONFIG.subMchId` 填入。

## 三、上传并部署云函数

在微信开发者工具中，右键 `cloudfunctions/` 下每个函数目录 → 上传并部署（云端安装依赖）。共 15 个：

| 函数 | 职责 |
|---|---|
| getShopInfo | 店铺基础信息 |
| getBusinessStatus | 计算营业状态 |
| createOrder | 创建订单 + 微信支付（支持重新支付） |
| payNotify | 微信支付结果回调 |
| queryOrder | 查询单个订单（本人） |
| getMyOrders | 我的订单列表 |
| updateOrderStatus | 管理员改订单状态 |
| getAdminStats | 经营概览 |
| getAdminOrders | 全部订单（管理员） |
| checkAdmin | 管理员鉴权 |
| manageDish / manageCategory / manageHours / manageMaterials | 管理端 CRUD |
| initData | 初始化示例数据 |

## 四、数据库集合与权限

在 CloudBase 控制台创建以下集合（权限均设为「**自定义安全规则**」）：

```json
// 顾客端需直接读取的集合：res_dishes / res_categories / res_business_status / res_shop_info / res_materials
{ "read": true, "write": false }

// 仅经云函数访问的集合：res_orders / res_admins
{ "read": false, "write": false }
```

> 云函数以管理员身份运行，不受上述客户端权限限制，可正常读写。

集合字段设计见方案文档第四章（res_categories / res_dishes / res_business_status / res_shop_info / res_materials / res_orders / res_admins）。

## 五、初始化数据

部署后，在 CloudBase 控制台运行云函数 `initData`（测试调用即可）。它会幂等写入：店铺信息、营业状态、分类、5 道示例菜品，并把**当前调用者注册为店主**（首次运行且无管理员时）。

## 六、上传图片素材（对应 10 张原图）

1. 门面/院落照片（图1-3）→ 云存储 `materials/hero/`，并在 `res_shop_info.heroImages` 写入其 fileID 数组（也可在管理端「素材管理」选「门店形象」上传，再由开发者同步到 heroImages）。
2. 规章制度照片（图4-8）→ 管理端「素材管理」选「规章制度」上传，标题填对应制度名（如「食品安全事故应急处置预案」）。
3. 纸质菜单（图9-10）→ 可保留在「素材管理-门店形象」作怀旧展示，或作为录入菜品的参考。
4. 菜品图：在管理端「菜品管理」新增/编辑时直接选择上传。

## 七、真机预览与提审

- 微信开发者工具 → 预览 → 手机扫码，验证：品牌首页、菜单实时上下架、拨号、地图导航、下单支付、管理端状态切换。
- 提审前确认：隐私协议与《微信小程序隐私保护指引》已配置；地理位置/电话权限仅在对应页面申请；类目选择「餐饮」并备齐**营业执照 + 食品经营许可证**。
