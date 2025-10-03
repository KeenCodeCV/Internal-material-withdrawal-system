# 📦 Internal Material Withdrawal System

ระบบเบิกจ่ายวัสดุภายในองค์กร  
พัฒนาโดยใช้ **Next.js + Node.js + Express + MySQL + TailwindCSS + SweetAlert2 + Framer Motion**  

![Banner](https://img.shields.io/badge/Next.js-14-black?logo=next.js) 
![Node.js](https://img.shields.io/badge/Node.js-22-green?logo=node.js) 
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql) 
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?logo=tailwindcss) 
![SweetAlert2](https://img.shields.io/badge/SweetAlert2-🔥-orange) 

---

## 🚀 คุณสมบัติหลัก

- 👤 **ระบบล็อกอิน/สิทธิ์การใช้งาน**
  - พนักงานทั่วไป: สร้างคำขอเบิก, ดูสถานะของตนเอง
  - ผู้อนุมัติ/แอดมิน: อนุมัติ, ปฏิเสธ, ลบคำขอ และจัดการวัสดุ

- 📝 **การสร้างคำขอ**
  - เลือกวัสดุจากคลัง
  - กำหนดจำนวน
  - บันทึกเป็น **DRAFT** หรือส่ง **SUBMITTED**

- ✅ **กระบวนการอนุมัติ**
  - แอดมินสามารถตรวจสอบสต็อก
  - อนุมัติ → ตัดสต็อกอัตโนมัติ
  - ปฏิเสธ → พร้อมเหตุผล

- 📊 **แดชบอร์ด**
  - KPI ของคำขอ (DRAFT, SUBMITTED, APPROVED, REJECTED)
  - ตารางคำขอล่าสุดของผู้ใช้
  - ตารางคำขอรออนุมัติของผู้อนุมัติ

- 📦 **จัดการวัสดุ (Items)**
  - เพิ่ม, แก้ไข, ลบวัสดุ
  - ปรับคงเหลือในสต็อกได้ (เฉพาะผู้จัดการ/แอดมิน)

---

## 🛠️ เทคโนโลยีที่ใช้

- **Frontend**: Next.js (App Router) + TailwindCSS + Framer Motion
- **Backend**: Node.js + Express
- **Database**: MySQL (Prisma ORM/Raw Query)
- **UI/UX**: SweetAlert2, Animations
- **Auth**: JWT + Role-based Access

---

## ⚙️ การติดตั้งและใช้งาน

```bash
# 1. Clone โปรเจค
git clone https://github.com/KeenCodeCV/Internal-material-withdrawal-system.git
cd Internal-material-withdrawal-system

# 2. ติดตั้ง dependencies
npm install

# 3. ตั้งค่า Database (MySQL)
# สร้าง database: materialflow
# import ไฟล์ schema.sql (ถ้ามี)

# 4. ตั้งค่า ENV
cp .env.example .env

# 5. รัน Backend
cd apps/api
npm start

# 6. รัน Frontend
cd ../web
npm run dev

# 7. เข้าใช้งาน
http://localhost:3000
```

---

## 📂 โครงสร้างไฟล์

```
apps/
 ├── api/                 # Express Backend
 │   ├── src/
 │   │   ├── routes/      # Routing: requisitions, items
 │   │   ├── middleware/  # Auth, RoleGuard
 │   │   └── db.js        # Database Connector
 │   └── server.js
 │
 └── web/                 # Next.js Frontend
     ├── app/
     │   ├── dashboard/   # Dashboard (User/Admin)
     │   ├── requisitions # Pages: my, new
     │   ├── approvals/   # Pages: approve, history
     │   └── items/       # Manage items
     └── components/      # AuthProvider, Nav
```

---

## 📸 Screenshots

### 🔑 Login / Role-based Access
![Login](https://via.placeholder.com/800x400.png?text=Login+Page)

### 📊 Dashboard
![Dashboard](https://via.placeholder.com/800x400.png?text=Dashboard+Page)

### ✅ Approvals
![Approvals](https://via.placeholder.com/800x400.png?text=Approvals+Page)

---

## 👨‍💻 ผู้พัฒนา
- [KeenCodeCV](https://github.com/KeenCodeCV)

---

## 📜 License
MIT License © 2025
