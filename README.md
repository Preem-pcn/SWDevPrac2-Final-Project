# Saengdao Night Market · Vendor Spot Booking (Frontend)

Frontend ของ SW Dev Prac 2 Project 5: ระบบจองพื้นที่ขายของในตลาดกลางคืน
ใช้ **Next.js 16 (App Router) + Tailwind CSS 4** ต่อกับ backend ของวิชา
[PJ05-MarketVendorBook](https://github.com/SWDevPrac2-69-1/PJ05-MarketVendorBook)

ดีไซน์และ UI flow อยู่ใน Figma (หน้า `swdev2`)

## เว็บทำอะไรได้บ้าง

**ทุกคน (ไม่ต้อง login)**
- หน้า Home: แผนผังแผงทั้งหมด, การ์ดแต่ละ zone (จำนวน spot, ช่วงราคา), วิธีจอง และกฎการจอง
- หน้า Spots: แผนผัง spot แยกตาม zone, กดช่องเพื่อดูรายละเอียด (หมายเลข, zone, ขนาด, ตำแหน่ง, ค่าเช่า) และตารางรายการ spot
- สมัครสมาชิก (name, email, tel, role, password) มีตรวจฟอร์มก่อนส่ง และ login / logout

**Member**
- เลือกวันในหน้า Spots เพื่อดูว่าตัวเองจองช่องไหนไว้ และใช้โควตาไปกี่ spot ในคืนนั้น
- จอง spot: เลือก spot, วันที่, ประเภทสินค้า (มีปุ่มตัวเลือกให้กด) ระหว่างกรอกมี checklist กฎ 4 ข้ออัปเดตตามที่เลือก
- ถ้าจองผิดเงื่อนไข (วันย้อนหลัง, spot ถูกคนอื่นจองแล้ว, เกิน 3 spots ต่อคืน, จอง spot เดิมซ้ำวันเดียวกัน) จะเห็นข้อความ error จาก backend
- My bookings: ตารางการจองของตัวเอง แก้ไข (spot / วัน / สินค้า) และลบ (มี dialog ยืนยัน) พร้อมแถบ 7 คืนข้างหน้าที่บอกโควตาแต่ละคืน

**Admin**
- All bookings: เห็นการจองของทุกคน กรองตามวันและ zone มีการ์ดสถิติ (จำนวนจอง, spot ว่าง, จำนวนผู้ค้า, ค่าเช่ารวม) และแถบความเต็มของแต่ละ zone
- แก้ไขและลบ booking ของใครก็ได้
- Manage spots: เพิ่ม, แก้ไข, ลบ spot โดยหน้าเพิ่ม/แก้ไขมี preview ว่าผู้ค้าจะเห็นอย่างไร
- หน้า Spots ของ admin แสดงว่า spot ไหนถูกจองแล้วในคืนที่เลือก และใครจอง

**Extra (กำลังทำ ดู [TEAM_TASKS.md](TEAM_TASKS.md))**
- ปฏิทินที่ลากการจองไปวันอื่นได้
- บัตรผ่านเข้าตลาดพร้อม QR code ดาวน์โหลดเป็น PNG / PDF
- Admin dashboard

## เริ่มใช้งานในเครื่อง

### 1. Backend

```bash
git clone https://github.com/SWDevPrac2-69-1/PJ05-MarketVendorBook.git
cd PJ05-MarketVendorBook
npm ci
# ใส่ MONGO_URI (MongoDB Atlas) ใน config/config.env
npm run dev          # http://localhost:5000, API docs ที่ /api-docs
```

### 2. Frontend

```bash
npm install
cp .env.example .env.local     # BACKEND_URL=http://localhost:5000
npm run seed                   # สร้างบัญชีตัวอย่าง + 36 spots (รันซ้ำได้ ไม่สร้างซ้ำ)
npm run dev                    # http://localhost:3000
```

บัญชีที่ `npm run seed` สร้างให้:

| Role | Email | Password |
|---|---|---|
| admin | admin@saengdao.market | admin123 |
| member | somchai@example.com | member123 |

## โครงสร้าง

```text
src/
  app/                      หน้าเว็บ (App Router)
    api/auth/*              login / register / logout: เก็บ JWT ใน httpOnly cookie
    api/proxy/[...path]     ส่งต่อ request ไป backend พร้อมแนบ token
    spots/ bookings/ admin/ login/ register/
  components/               UI แยกตามหน้า (spots, bookings, admin, auth)
  lib/                      types, date helpers (UTC), api client, session
  proxy.ts                  กันหน้า /bookings และ /admin (Next 16 เปลี่ยนชื่อ middleware เป็น proxy)
scripts/seed.mjs            เตรียมข้อมูลตัวอย่างสำหรับ demo
```

**ทำไมเรียก backend ผ่าน `/api/proxy`:** token จะอยู่ใน httpOnly cookie ฝั่ง JavaScript ของ browser อ่านไม่ได้
และ browser คุยกับ Next.js อย่างเดียว จึงไม่ติด CORS ของ backend ตอน deploy ขึ้น Vercel

## ข้อควรรู้

- **วันที่เป็น UTC ตาม backend:** ช่วง 00:00–07:00 เวลาไทย "วันนี้" ในระบบยังเป็นวันก่อนหน้า
- **Member เห็นแค่ booking ของตัวเอง:** หน้า Spots ของ member จึงบอกไม่ได้ว่าช่องไหนคนอื่นจองแล้ว ต้องรู้ตอนกดยืนยัน ส่วน admin เห็นครบ
- **ลบ spot เป็น soft delete:** spot หายจากแผนผัง แต่ booking เดิมยังอยู่และยังนับโควตาของผู้ค้า
- **Backend จำกัด 100 requests ต่อ 10 นาทีต่อ IP:** หลัง deploy ทุก request ออกจาก server เดียวกัน เว็บจึงลดการยิงเอง: server เก็บข้อมูล spot ไว้ 1 นาทีแล้วใช้ร่วมกันทุกคน, browser เก็บผลไว้ (spot 5 นาที, booking 1 นาที) และล้างทันทีเมื่อมีการจอง/แก้/ลบหรือ login/logout ทั้ง Presentation Journey ใช้ราว 40 requests

## Deploy ขึ้น Vercel

1. Deploy backend ให้มี URL สาธารณะ (เช่น Render, Railway หรือ Vercel) และใช้ MongoDB Atlas
2. Import repo นี้ใน Vercel แล้วตั้ง Environment Variable `BACKEND_URL=https://<backend-url>`
3. รัน seed ใส่ backend ที่ deploy แล้ว: `BACKEND_URL=https://<backend-url> npm run seed`

## ลำดับ demo (Presentation Journey)

| ขั้น | ทำที่ |
|---|---|
| 1–2 ลงทะเบียน (ลองกรอกผิดก่อน) + login | /register, /login |
| 3 ดู spot | /spots |
| 4 สร้าง booking + ลองผิดเงื่อนไข | /spots → Book → ลองจอง A3 ของคนอื่น / วันย้อนหลัง / spot ที่ 4 ในคืนเดียว |
| 5–7 ดู / แก้ / ลบ booking ของตัวเอง | /bookings |
| 8 logout | ปุ่ม Log out |
| 9–12 admin login, ดู / แก้ / ลบ booking ใดก็ได้ | /admin → All bookings |
| 13 admin สร้าง spot | Manage spots → Add spot |
| 14 extra | ปฏิทิน, บัตรผ่าน QR, dashboard |
