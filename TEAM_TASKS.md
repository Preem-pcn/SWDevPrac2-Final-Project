# งานที่เหลือสำหรับทีม

Basic requirement (Presentation Journey ข้อ 1–13) ทำงานครบแล้ว งานที่เหลือคือ extra credit 3 ชิ้น
กับงานส่งท้าย แต่ละชิ้นแยกไฟล์กันชัดเจน แบ่งให้คนละชิ้นได้โดยไม่ชนกัน

**ทุกชิ้นต่อเข้ากับหน้าเว็บไว้แล้ว:** route, ปุ่ม, ลิงก์ใน nav และ props พร้อมใช้
ตอนนี้แต่ละจุดแสดงกล่อง "in progress" ให้แก้แค่ไฟล์ที่ระบุใน task
library ที่ต้องใช้ติดตั้งไว้ใน `package.json` แล้ว

ดีไซน์ของแต่ละหน้าอยู่ใน Figma หน้า `swdev2` ส่วน flow อยู่ในเลน "Extras" ของผัง UI flow

## วิธีทำงานร่วมกัน (ให้ GitHub Contributors เห็นงานของทุกคน)

1. แตก branch ของตัวเอง เช่น `git checkout -b feat/calendar`
2. commit บ่อย ๆ ด้วย GitHub account ของตัวเอง เช็กได้ด้วย `git config user.email`
3. เปิด Pull Request เข้า `main` ให้เพื่อนรีวิว แล้ว merge
4. ก่อน push ให้รัน `npm run lint` และ `npm run build` ผ่านทั้งคู่

---

## Task 1: ปฏิทินที่ลากการจองไปวันอื่นได้

**ไฟล์:** `src/components/bookings/Calendar.tsx`
**ดูผลที่:** `/bookings` → กดแท็บ **Calendar** (ทั้ง member และ admin)
**Figma:** `My bookings – calendar`

Props ที่ได้รับ (มีอยู่แล้วในไฟล์):

```ts
bookings: Booking[]   // ทุก booking ที่ผู้ใช้เห็น (member = ของตัวเอง, admin = ทั้งหมด)
showVendor: boolean   // true สำหรับ admin: แสดงชื่อผู้ค้าใน tooltip
onMove: (booking, toDate: "YYYY-MM-DD") => Promise<void>
// ส่ง PUT ไป backend และแสดงข้อความสำเร็จหรือ error ให้แล้ว ไม่ต้องเรียก API เอง
```

**ต้องทำ**
- ปฏิทินรายเดือน เริ่มสัปดาห์วันจันทร์ 6 แถว มีปุ่มเดือนก่อน/ถัดไป และไฮไลต์วันนี้
- แต่ละวันแสดง booking เป็นชิปหมายเลข spot กดชิปแล้วไปหน้าบัตรผ่าน `/bookings/<id>/pass`
- ลากชิปไปวางวันอื่นแล้วเรียก `onMove(booking, day)`
- ระหว่างลาก วันปลายทางเปลี่ยนสี: ฟ้า = วางได้, แดง = วางไม่ได้ (วันที่ผ่านแล้ว, ผู้ค้าคนนั้นมีครบ 3 spots คืนนั้น หรือ spot เดียวกันถูกจองคืนนั้น)
- booking ในอดีตลากไม่ได้
- แผงข้างอธิบายสีและวิธีลาก

**Hint**
- ใช้ `@dnd-kit/core` (`DndContext`, `useDraggable`, `useDroppable`, `DragOverlay`) ใส่ `PointerSensor` กับ `activationConstraint: { distance: 6 }` ให้คลิกเฉย ๆ ยังเปิดบัตรผ่านได้
- helper วันที่อยู่ใน `src/lib/date.ts`: `dayKey`, `addDays`, `keyToDate`, `todayKey`, `formatDay` ทุกตัวเป็น UTC ตาม backend
- ใส่ `touch-none` บนชิปเพื่อให้ลากบนมือถือได้

**ทดสอบ:** ลากไปวันที่ว่างแล้วต้องย้ายจริง (เช็กจากตารางในแท็บ List), ลากไปวันที่ผ่านแล้วต้องเด้งกลับพร้อม error, กด Esc ระหว่างลากต้องยกเลิกได้

---

## Task 2: บัตรผ่านเข้าตลาดพร้อม QR code

**ไฟล์:** `src/components/bookings/PassView.tsx`
**ดูผลที่:** ปุ่ม **Pass** ในตาราง My bookings หรือ All bookings → `/bookings/<id>/pass`
**Figma:** `Booking pass`

**ต้องทำ**
- โหลด booking ด้วย `api<Booking>(`/bookings/${id}`)` จาก `@/lib/api` ร่วมกับ `useLoad` จาก `@/lib/hooks`
- บัตรทรงตั๋ว: ส่วนบนสีเหลืองมีหมายเลข spot ตัวใหญ่, zone, ขนาด / มีรอยปรุ / ส่วนล่างมีวัน, เวลาเปิด 17:00, ชื่อผู้ค้า, สินค้า และ QR code
- QR เก็บข้อความรายละเอียดการจอง เช่น `SAENGDAO NIGHT MARKET|BOOKING <id>|SPOT A7|NIGHT 2026-11-21|VENDOR <name>`
- ปุ่ม Download PNG และ Download PDF ที่ได้ไฟล์ของตัวบัตร
- นับถอยหลังถึงเวลาตลาดเปิดของคืนนั้น (`marketOpensAt(day)` ใน `src/lib/date.ts`) ถ้าคืนนั้นผ่านไปแล้วให้บอกว่าผ่านแล้ว
- (ถ้ามีเวลา) รายการบัตรใบอื่นของ member ที่ยังไม่ถึงวัน

**Hint**
- QR: `import QRCode from "qrcode"` แล้ว `await QRCode.toDataURL(text, { margin: 0, width: 368 })`
- PNG: `toPng(ref.current, { pixelRatio: 3 })` จาก `html-to-image`
- PDF: `new jsPDF({ unit: "px", format: [w, h] })` แล้ว `addImage(png, "PNG", ...)` จาก `jspdf`
- import สอง library หลังด้วย `await import(...)` ตอนกดปุ่ม เพื่อไม่ให้หน้าโหลดช้า

**ทดสอบ:** สแกน QR ด้วยมือถือต้องอ่านข้อความออก, ไฟล์ PNG/PDF ต้องเห็นบัตรครบ, member เปิดบัตรของคนอื่นไม่ได้ (backend ตอบ 403 ให้แสดง error)

---

## Task 3: Admin dashboard

**ไฟล์:** `src/components/admin/Dashboard.tsx`
**ดูผลที่:** login เป็น admin แล้วจะเข้าหน้า `/admin` ทันที
**Figma:** `Admin – dashboard`

**ต้องทำ**
- ช่องเลือกคืนตลาด (ค่าเริ่มต้นคือวันนี้)
- การ์ดสถิติ 4 ใบของคืนที่เลือก: จำนวน booking, spot ที่ยังว่าง (จาก N), จำนวนผู้ค้า (นับ user ไม่ซ้ำ), ค่าเช่ารวม (ผลรวม `spot.rentalFee`)
- กราฟแท่ง 7 คืนนับจากคืนที่เลือก กดแท่งเพื่อเปลี่ยนคืน
- รายการ booking ล่าสุด 4 รายการ (เรียงตาม `createdAt`) และลิงก์ไป All bookings
- แถบความเต็มของแต่ละ zone: ใช้ `ZoneBars` ที่ export จาก `src/components/bookings/BookingsView.tsx` ได้เลย

**Hint**
- ข้อมูลทั้งหมดได้จาก `api<Booking[]>("/bookings")` (admin ได้ทุก booking) และ `api<Spot[]>("/spots")` ไม่ต้องแก้ backend
- กราฟทำด้วย `div` กับ Tailwind ได้ ความสูงแท่ง = `n / max * 220px` ไม่ต้องใช้ library กราฟ
- ดูวิธีคำนวณสถิติได้จากส่วน admin stats ใน `BookingsView.tsx`

**ทดสอบ:** ตัวเลขต้องตรงกับหน้า All bookings เมื่อกรองวันเดียวกัน, เปลี่ยนวันแล้วทุกการ์ดต้องเปลี่ยนตาม

---

## Task 4: Deploy และเตรียม demo

- Deploy backend ให้มี URL สาธารณะ (Render / Railway / Vercel) + MongoDB Atlas
- Deploy frontend ขึ้น Vercel และตั้ง `BACKEND_URL` (ดู README)
- รัน `npm run seed` ใส่ backend ที่ deploy แล้ว ให้มี spot พร้อม demo
- ทำสไลด์: โจทย์, UI flow จาก Figma, ลิงก์ GitHub + Vercel, หน้า GitHub Insights → Contributors
- ซ้อม demo ตามลำดับใน README ให้จบใน 7 นาที

---

## Checklist ก่อนส่ง (พุธ 18 พ.ย. 23:00)

- [ ] Task 1–3 merge เข้า `main` แล้ว และ `npm run build` ผ่าน
- [ ] Vercel ใช้งานได้ และ login ได้ทั้ง admin กับ member
- [ ] มี spot ตัวอย่างในระบบที่ deploy
- [ ] ส่งใน MCV: ลิงก์ GitHub + Vercel, ไฟล์สไลด์, ไฟล์ UI Design
- [ ] จองเวลานำเสนอใน Google Sheet แล้ว (แก้ได้ถึงอังคาร 17 พ.ย. 23:00)
