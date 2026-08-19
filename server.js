require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-flash-latest';

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10mb' }));

app.post('/api/classify', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY — เพิ่มใน .env ก่อนใช้งาน',
      });
    }

    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: 'ไม่พบข้อมูลรูปภาพ' });
    }

    const promptText = `คุณเป็นเจ้าหน้าที่ตรวจสอบและจำแนกประเภทป้ายตาม พระราชบัญญัติภาษีป้าย พ.ศ. 2510 ของประเทศไทย
ให้ตรวจดูรูปป้ายนี้ แล้วตอบเป็น JSON สั้นๆ เท่านั้น ห้ามใส่ข้อความอื่น:
{
  "type": 1 หรือ 2 หรือ 3,
  "isMoving": true หรือ false,
  "detectedText": "ข้อความสำคัญที่อ่านได้บนป้าย",
  "reasoning": "อธิบายเหตุผลสั้นๆ 1 ประโยค"
}

เกณฑ์ตัดสิน:
- ประเภท 1: มีเฉพาะตัวอักษรภาษาไทยล้วน ไม่มีอักษรต่างประเทศและไม่มีรูปภาพ/โลโก้
- ประเภท 2: มีตัวอักษรไทยปนตัวอักษรต่างประเทศหรือปนภาพ โดยตัวอักษรไทยต้องอยู่แถวบนสุด และขนาดไม่เล็กกว่าอักษรต่างประเทศ
- ประเภท 3: ไม่มีตัวอักษรไทยเลย หรือมีตัวอักษรไทยแต่อยู่ใต้/หลัง/ขนาดเล็กกว่าตัวอักษรต่างประเทศ`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText },
            { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } },
          ],
        },
      ],
    };

    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const data = await apiRes.json();
    if (!apiRes.ok || data.error) {
      console.error('Gemini API error:', apiRes.status, data.error);
      return res.status(502).json({ error: data.error?.message || 'เรียก Gemini API ไม่สำเร็จ' });
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return res.status(502).json({ error: 'AI ไม่ได้ตอบข้อมูลกลับมา ลองใหม่อีกครั้ง' });
    }

    const cleanJson = rawText.replace(/```json|```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (e) {
      console.error('Failed to parse Gemini response:', rawText);
      return res.status(502).json({ error: 'แปลผลลัพธ์จาก AI ไม่สำเร็จ' });
    }

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

app.listen(PORT, () => {
  console.log(`Sign tax calculator running at http://localhost:${PORT}`);
});
