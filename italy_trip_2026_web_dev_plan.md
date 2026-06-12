# Italy Trip 2026 网页开发方案

> 用途：给 Codex 执行，生成一个 4 人意大利旅行专用网页。

---

## 1. 项目目标

为 2026 年 10 月意大利 4 人旅行制作一个统一网页，用来集中管理所有旅行相关事项。

核心目标：

- 所有人可以随时查看最新行程
- 集中管理机票、酒店、火车、门票、餐厅预订
- 清楚记录谁付款、谁还欠钱
- 快速找到地图、确认单、紧急资料
- 手机上也要非常好用

设计原则：

> 4 个人打开网页后，可以马上知道：今天去哪里、几点集合、怎么去、票在哪里、谁付了钱、有问题找谁。

---

## 2. 推荐技术栈

建议使用：

```text
Next.js
React
TypeScript
Tailwind CSS
Static data with tripData.ts or tripData.json
Deploy to Vercel / Netlify / GitHub Pages
```

不需要后端，不需要数据库。

原因：

- 易部署
- 易维护
- 手机体验好
- 静态网页足够旅行使用
- 数据集中在一个文件里，之后方便修改

---

## 3. 网站整体结构

```text
Italy Trip 2026
├── Dashboard 首页
├── Itinerary 每日行程
├── Bookings 预订中心
├── Budget 费用分摊
├── Map 地图
├── Food 餐厅清单
├── Attractions 景点清单
├── Packing List 打包清单
├── Documents 文件库
└── Emergency 紧急信息
```

---

## 4. 页面设计要求

## 4.1 Dashboard 首页

首页是整个网页的总览页。

### 应包含

- 旅行名称：Italy Trip 2026
- 旅行月份：October 2026
- 人数：4 pax
- 倒数天数
- 城市路线总览
- 预订进度
- 总预算概览
- 下一项待办事项
- 今日或下一天行程
- 紧急信息快捷入口

### Dashboard 卡片

建议显示这些卡片：

```text
Trip Dates
Participants
Cities
Booking Progress
Total Budget
Next Deadline
Emergency Contact
```

### 预订进度状态

状态可使用：

```text
Not Started
Pending
Partially Booked
Booked
Paid
Need Confirmation
```

示例：

```text
Flights: Pending
Hotels: Partially Booked
Train Tickets: Pending
Attraction Tickets: Pending
Insurance: Pending
Entry Requirement / ETIAS: Check Before Departure
```

### 旅行提醒

首页应有一个提醒区：

```text
Important Reminders
- Check passport validity
- Confirm ETIAS / Schengen entry requirement before departure
- Buy travel insurance
- Download offline Google Maps
- Save all tickets offline
```

备注：ETIAS 官方目前显示预计 2026 年第四季度开始运行，2026 年 10 月旅行前需要再次确认是否已经正式启用。短期申根旅游一般遵循 90/180 天规则。

---

## 4.2 Itinerary 每日行程页

这是最重要的页面。

建议用 timeline 或 card layout。

### 页面展示

```text
Day 1 - Singapore → Rome
Day 2 - Rome
Day 3 - Vatican City
Day 4 - Florence
Day 5 - Pisa / Tuscany
Day 6 - Venice
Day 7 - Milan
...
```

### 每日行程卡片内容

每一天应包含：

- Day number
- Date
- City
- Hotel / base location
- Morning plan
- Afternoon plan
- Evening plan
- Transport
- Meals
- Tickets
- Google Maps links
- Estimated cost
- Notes

### 数据结构示例

```ts
export type ItineraryDay = {
  day: number;
  date: string;
  city: string;
  title: string;
  hotel?: string;
  morning: string[];
  afternoon: string[];
  evening: string[];
  transport: string[];
  meals: string[];
  tickets: string[];
  estimatedCost: number;
  currency: "EUR" | "SGD";
  notes: string;
  mapLinks: {
    label: string;
    url: string;
  }[];
};
```

### UI 示例

```text
Day 3: Vatican City
Date: 2026-10-xx
Base: Rome

09:00 - Vatican Museums
12:30 - Lunch
14:00 - St. Peter's Basilica
18:30 - Dinner

Tickets: Vatican Museum - Pending
Transport: Metro / Walk
Notes: Dress code required
```

### 功能要求

- 可按城市筛选
- 可展开/收起每日详情
- 手机上要容易阅读
- 每一天要有 “Open in Google Maps” 链接
- 当天重要信息要突出显示

---

## 4.3 Bookings 预订中心

集中管理所有预订事项。

### 分类

```text
Flights
Hotels
Trains
Attractions
Restaurants
Insurance
Others
```

### 字段设计

```ts
export type Booking = {
  id: string;
  category: "Flight" | "Hotel" | "Train" | "Attraction" | "Restaurant" | "Insurance" | "Other";
  title: string;
  date: string;
  time?: string;
  location?: string;
  bookedBy: string;
  paidBy?: string;
  amount?: number;
  currency?: "EUR" | "SGD";
  status: "Not Booked" | "Pending" | "Booked" | "Paid" | "Cancelled" | "Need Confirmation";
  confirmationLink?: string;
  notes?: string;
};
```

### 页面功能

- 按类别筛选
- 按状态筛选
- 显示已完成 / 未完成数量
- 显示未付款项目
- 显示确认单链接

### 表格字段

```text
Category | Title | Date | Time | Location | Booked By | Paid By | Amount | Status | Link | Notes
```

---

## 4.4 Budget 费用分摊页

用于记录 4 人旅行费用，避免之后算钱混乱。

### 页面目标

- 看总费用
- 看每人应付多少
- 看每人已经付了多少
- 看谁欠谁多少钱
- 看哪些费用还没有结清

### 数据结构

```ts
export type Expense = {
  id: string;
  date: string;
  item: string;
  category: "Flight" | "Accommodation" | "Transport" | "Food" | "Attraction" | "Insurance" | "Other";
  amount: number;
  currency: "EUR" | "SGD";
  paidBy: string;
  splitAmong: string[];
  notes?: string;
  settled: boolean;
};
```

### 页面应显示

```text
Total Trip Cost
Cost Per Person
Amount Paid By Each Person
Amount Owed By Each Person
Settlement Summary
Unsettled Expenses
```

### Summary 示例

```text
Total Trip Cost: EUR 4,800
Cost Per Person: EUR 1,200

Person A paid: EUR 2,000
Person B paid: EUR 800
Person C paid: EUR 1,000
Person D paid: EUR 1,000

Settlement:
Person B pays Person A EUR 400
Person C pays Person A EUR 200
```

### 功能要求

- 自动计算每人平均分摊金额
- 自动计算每人已付款金额
- 自动显示未结清费用
- 支持 EUR 和 SGD
- 可先用静态计算，不需要实时汇率

---

## 4.5 Map 地图页

建议嵌入 Google My Maps。

### 地图分类

```text
Hotels
Attractions
Restaurants
Train Stations
Airports
Pharmacies
Supermarkets
Emergency Locations
```

### 页面内容

```text
Main Trip Map
Rome Map
Florence Map
Venice Map
Milan Map
```

### iframe 示例

```tsx
<iframe
  src="GOOGLE_MY_MAPS_EMBED_LINK"
  width="100%"
  height="500"
  loading="lazy"
></iframe>
```

### 功能要求

- 地图 iframe responsive
- 地图下方列出重要地点
- 每个地点有 Google Maps link

---

## 4.6 Food 餐厅清单页

用于记录想吃的餐厅、已订餐厅和备选餐厅。

### 数据结构

```ts
export type Restaurant = {
  name: string;
  city: string;
  cuisine: string;
  priority: "Must Try" | "Good to Have" | "Backup";
  priceRange: "€" | "€€" | "€€€" | "€€€€";
  reservationStatus: "Not Needed" | "Not Booked" | "Pending" | "Booked";
  googleMapsLink?: string;
  notes?: string;
};
```

### 分类

```text
Must Try
Good to Have
Near Hotel
Cheap Eats
Dessert / Gelato
Coffee
```

### 页面功能

- 按城市筛选
- 按优先级筛选
- 显示是否需要订位
- 显示 Google Maps 链接

---

## 4.7 Attractions 景点清单页

用于记录景点、门票状态、优先级。

### 数据结构

```ts
export type Attraction = {
  name: string;
  city: string;
  priority: "Must Visit" | "Nice to Have" | "Optional";
  ticketRequired: boolean;
  bookingStatus: "Not Needed" | "Pending" | "Booked";
  estimatedDuration: string;
  officialWebsite?: string;
  googleMapsLink?: string;
  notes?: string;
};
```

### 状态

```text
Must Visit
Optional
Booked
Need Ticket
Free Entry
Closed on Certain Days
```

### 页面功能

- 按城市筛选
- 按优先级筛选
- 显示是否需要买票
- 显示门票状态
- 显示预计游玩时间

---

## 4.8 Packing List 打包清单页

### 分类

```text
Documents
Clothes
Electronics
Medicine
Toiletries
Travel Essentials
Shared Items
```

### 数据结构

```ts
export type PackingItem = {
  item: string;
  category: "Documents" | "Clothes" | "Electronics" | "Medicine" | "Toiletries" | "Travel Essentials" | "Shared Items";
  owner: string | "Everyone";
  required: boolean;
  checked: boolean;
};
```

### 默认重要项目

```text
Passport
Travel insurance
Credit card / debit card
EUR cash
Power adapter
SIM / eSIM
Comfortable shoes
Medicine
Umbrella
Printed backup documents
Power bank
Phone charger
```

### 功能要求

- checkbox style checklist
- 按分类显示
- 必带物品突出显示
- Shared items 标明由谁负责

---

## 4.9 Documents 文件库

注意：不要把敏感文件直接放进公开网页。

网页只放 Google Drive / iCloud Drive / OneDrive 私人链接。

### 分类

```text
Flights
Hotels
Train Tickets
Attraction Tickets
Insurance
Passport Copies
Payment Receipts
Others
```

### 数据结构

```ts
export type DocumentLink = {
  title: string;
  category: "Flight" | "Hotel" | "Train" | "Attraction" | "Insurance" | "Passport" | "Receipt" | "Other";
  owner: string;
  link: string;
  sensitive: boolean;
  notes?: string;
};
```

### 隐私要求

- 护照、保险、身份证明文件不要公开
- 如果网页部署到公开链接，不要放真实护照号码
- 文件链接应设置为只有 4 个旅行成员可访问
- 页面可显示 “Sensitive” 标签

---

## 4.10 Emergency 紧急信息页

这个页面必须非常清楚，手机上要一眼看到。

### 必须包含

```text
Italy emergency number: 112
4 travellers' phone numbers
Hotel addresses
Travel insurance hotline
Bank card lost/stolen hotline
Singapore consular assistance link
Nearest hospital / pharmacy
Passport lost instructions
```

### 数据结构

```ts
export type EmergencyInfo = {
  type: "Emergency Number" | "Traveller" | "Hotel" | "Insurance" | "Bank" | "Embassy" | "Medical" | "Other";
  title: string;
  value: string;
  notes?: string;
};
```

### UI 要求

- 112 紧急电话必须放最上方
- 使用醒目的 emergency card
- 电话号码可点击拨打
- 地址可点击打开地图

---

## 5. 数据文件建议

建立：

```text
/src/data/tripData.ts
```

集中管理所有资料。

### 基础数据示例

```ts
export const tripInfo = {
  title: "Italy Trip 2026",
  month: "October 2026",
  participants: ["Person A", "Person B", "Person C", "Person D"],
  countries: ["Italy"],
  cities: ["Rome", "Florence", "Venice", "Milan"],
  status: {
    flights: "Pending",
    hotels: "Pending",
    trains: "Pending",
    attractions: "Pending",
    insurance: "Pending",
    entryRequirement: "Check Before Departure"
  }
};
```

---

## 6. 组件设计

建议建立以下组件：

```text
/components
├── Layout.tsx
├── Navbar.tsx
├── MobileNav.tsx
├── DashboardCard.tsx
├── StatusBadge.tsx
├── ItineraryCard.tsx
├── BookingTable.tsx
├── BudgetSummary.tsx
├── ExpenseTable.tsx
├── MapEmbed.tsx
├── Checklist.tsx
├── EmergencyCard.tsx
└── SectionHeader.tsx
```

### StatusBadge 要求

根据状态显示不同颜色：

```text
Booked / Paid: green
Pending / Need Confirmation: yellow
Cancelled / Urgent: red
Not Started / Not Booked: grey
```

---

## 7. UI / UX 风格

### 设计方向

```text
Clean
Mobile-first
Card-based
Travel dashboard style
Easy to scan
Not too decorative
```

### 颜色建议

```text
Background: off-white / light beige
Primary: deep green or terracotta
Accent: warm orange
Text: dark grey
Cards: white
```

### 手机体验要求

- Mobile-first responsive design
- Sticky bottom navigation or top navigation
- 大按钮
- 卡片间距清楚
- Emergency button 永远容易找到
- 表格在手机上可横向滚动或变成卡片

---

## 8. 功能优先级

## Phase 1: MVP

必须先完成：

```text
Dashboard
Itinerary
Bookings
Budget
Emergency
```

## Phase 2: Enhancement

之后再完成：

```text
Map
Food
Attractions
Packing List
Documents
```

## Phase 3: Optional Advanced Features

可选增强：

```text
Dark mode
Print itinerary
Export PDF
Calendar export .ics
Password protection
Editable admin mode
Currency converter
Search function
```

---

## 9. 建议路由

如果使用 Next.js App Router：

```text
/app
├── page.tsx
├── itinerary/page.tsx
├── bookings/page.tsx
├── budget/page.tsx
├── map/page.tsx
├── food/page.tsx
├── attractions/page.tsx
├── packing/page.tsx
├── documents/page.tsx
└── emergency/page.tsx
```

---

## 10. Codex 执行 Prompt

可以直接把下面这段给 Codex：

```text
Build a responsive travel dashboard website for a 4-person Italy trip in October 2026.

Use Next.js, TypeScript, and Tailwind CSS.

Create the following pages:
1. Dashboard
2. Itinerary
3. Bookings
4. Budget
5. Map
6. Food
7. Attractions
8. Packing List
9. Documents
10. Emergency

Use static data from /src/data/tripData.ts.

Design requirements:
- Mobile-first responsive design
- Card-based layout
- Clean travel dashboard style
- Status badges for booking/payment states
- Tables for bookings and expenses
- Timeline-style itinerary
- Google Maps iframe embed placeholder
- Emergency page with prominent emergency numbers
- No backend required
- No sensitive files stored directly in the project
- Easy to update by editing tripData.ts

Implement reusable components:
- Layout
- Navbar
- MobileNav
- StatusBadge
- DashboardCard
- ItineraryCard
- BookingTable
- ExpenseTable
- BudgetSummary
- Checklist
- EmergencyCard
- SectionHeader

Important UX requirement:
The website should be useful during the trip on a phone. Prioritise clarity over decoration.
```

---

## 11. Acceptance Criteria

Codex 完成后，网页应满足：

- 可以正常运行
- 所有页面都有内容和占位数据
- 手机、平板、桌面都能看
- Itinerary 清楚显示每天安排
- Bookings 清楚显示预订状态
- Budget 可以计算每人费用
- Emergency 页面可以快速找到 112 和重要联系人
- 所有数据集中在 tripData.ts
- 不包含真实敏感资料

---

## 12. 最重要原则

不要做成漂亮但难用的网页。

要做成旅行当天真的会打开来看的工具。

最高优先级：

```text
1. 今天几点去哪里
2. 怎么去
3. 票在哪里
4. 住哪里
5. 谁付了钱
6. 有问题找谁
```
