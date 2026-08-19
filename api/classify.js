const GEMINI_MODEL = 'gemini-flash-latest';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY บน Vercel' });
      return;
    }

    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64) {
      res.status(400).json({ error: 'ไม่พบข้อมูลรูปภาพ' });
      return;
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
      res.status(502).json({ error: data.error?.message || 'เรียก Gemini API ไม่สำเร็จ' });
      return;
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      res.status(502).json({ error: 'AI ไม่ได้ตอบข้อมูลกลับมา ลองใหม่อีกครั้ง' });
      return;
    }

    const cleanJson = rawText.replace(/```json|```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (e) {
      console.error('Failed to parse Gemini response:', rawText);
      res.status(502).json({ error: 'แปลผลลัพธ์จาก AI ไม่สำเร็จ' });
      return;
    }

    res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
};
