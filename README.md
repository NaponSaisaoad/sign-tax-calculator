# ระบบคำนวณภาษีป้าย

เว็บแอปคำนวณภาษีป้ายตามพระราชบัญญัติภาษีป้าย พ.ศ. 2510 พร้อมให้ AI (Gemini) ช่วยจำแนกประเภทป้ายจากรูปถ่าย

- Frontend: `public/index.html` (React ผ่าน CDN, ไม่ต้อง build)
- Backend: `server.js` (Express) — เป็น proxy เรียก Gemini API โดยเก็บ API key ไว้ฝั่งเซิร์ฟเวอร์เท่านั้น ไม่โผล่ในโค้ดฝั่ง client

## 1. ขอ Gemini API Key

1. ไปที่ [Google AI Studio](https://aistudio.google.com/apikey)
2. กด **Create API key** (คีย์จะขึ้นต้นด้วย `AIzaSy...` หรือ `AQ....`)
3. คัดลอกคีย์เก็บไว้

## 2. รันบนเครื่องตัวเอง (Local)

```bash
git clone https://github.com/NaponSaisaoad/sign-tax-calculator.git
cd sign-tax-calculator
npm install
```

สร้างไฟล์ `.env` (คัดลอกจาก `.env.example`) แล้วใส่คีย์ที่ได้จากขั้นตอนที่ 1:

```bash
cp .env.example .env
```

แก้ไฟล์ `.env`:

```
GEMINI_API_KEY=ใส่คีย์ของคุณตรงนี้
PORT=3001
```

รันเซิร์ฟเวอร์:

```bash
npm start
```

เปิดเบราว์เซอร์ไปที่ `http://localhost:3001`

> ห้าม commit ไฟล์ `.env` ขึ้น git เด็ดขาด (อยู่ใน `.gitignore` แล้ว) เพราะจะทำให้คีย์หลุดสู่สาธารณะถ้า repo เป็น public

## 3. Deploy ขึ้นเว็บฟรีด้วย Vercel

1. Push โค้ดขึ้น GitHub (repo จะต้องเป็น public ถ้าใช้ Vercel Hobby แบบฟรีและ deploy จากบัญชีที่ไม่ตรงกับเจ้าของ repo — ถ้า deploy เองด้วยบัญชีเดียวกัน จะเป็น private ก็ได้)
2. เข้า [vercel.com/new](https://vercel.com/new) → **Continue with GitHub** → เลือก repo `sign-tax-calculator` → **Import**
3. ในหน้า **Environment Variables** ใส่:
   - Key: `GEMINI_API_KEY`
   - Value: คีย์ของคุณ
4. กด **Deploy**

ระบบจะตรวจพบว่าเป็น Express app โดยอัตโนมัติ (ผ่าน `package.json`) และรัน `server.js` เป็น serverless function ให้เอง — ไม่ต้องตั้งค่า Build/Output Directory เพิ่มเติม

### แก้ไข Environment Variable ภายหลัง

ถ้าลืมใส่ตอน import หรืออยากเปลี่ยนคีย์: ไปที่ Vercel Dashboard → เลือกโปรเจกต์ → **Settings → Environment Variables** → เพิ่ม/แก้ `GEMINI_API_KEY` → กด **Redeploy** เพื่อให้มีผล

## โครงสร้างไฟล์

```
.
├── public/index.html   # หน้าเว็บทั้งหมด (React + CSS ในไฟล์เดียว)
├── server.js           # Express server: เสิร์ฟหน้าเว็บ + /api/classify
├── .env.example         # ตัวอย่างตัวแปรแวดล้อมที่ต้องตั้งค่า
└── package.json
```
