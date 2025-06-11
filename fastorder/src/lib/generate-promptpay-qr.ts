import { crc16 } from "./crc"

/**
 * Generate PromptPay QR code data based on the PromptPay ID and amount
 * Implementation follows the official PromptPay QR specification
 *
 * @param promptPayID - PromptPay ID (phone number or national ID)
 * @param amount - Payment amount
 * @returns QR code data string in the format that banking apps can recognize
 */
export function generatePromptPayQRData(promptPayID: string, amount: number): string {
  // ถ้าไม่มี promptPayID ให้คืนค่าว่าง
  if (!promptPayID) return ""

  // ลบอักขระที่ไม่ใช่ตัวเลขออก
  let formattedID = promptPayID.replace(/[^0-9]/g, "")

  // ตรวจสอบประเภทบัญชี (เบอร์โทรศัพท์หรือเลขบัตรประชาชน)
  let accountType
  if (formattedID.length >= 13) {
    accountType = "02" // เลขบัตรประชาชน
  } else {
    accountType = "01" // เบอร์โทรศัพท์

    // สำหรับเบอร์โทรศัพท์ ให้เปลี่ยนจาก 0 นำหน้าเป็น 66
    if (formattedID.startsWith("0")) {
      formattedID = "66" + formattedID.substring(1)
    }
  }

  // ฟังก์ชันสำหรับคำนวณความยาวของข้อมูลในรูปแบบ 2 หลัก
  const formatLength = (text: string) => {
    const length = text.length
    return length.toString().padStart(2, "0")
  }

  // สร้าง payload ตามมาตรฐาน EMVCo QR Code
  let payload = ""

  // ID ของ Payload Format Indicator
  payload += "000201" // เวอร์ชัน 01

  // Point of Initiation Method
  payload += "010212" // 01 = QR Code, 02 = ใช้ครั้งเดียว

  // Merchant Account Information for PromptPay
  const merchantAccountID = "29" // ID สำหรับ PromptPay
  const merchantAccountGUID = "0016A000000677010111" // Application ID สำหรับ PromptPay
  const merchantAccountInfo =
    merchantAccountGUID + // Application ID
    accountType + // ประเภทบัญชี (01=เบอร์โทร, 02=เลขบัตรประชาชน)
    formatLength(formattedID) + // ความยาวของ ID
    formattedID // ID (เบอร์โทรหรือเลขบัตรประชาชน)

  payload += merchantAccountID + formatLength(merchantAccountInfo) + merchantAccountInfo

  // Transaction Currency (764 = THB)
  payload += "5303764"

  // Transaction Amount (ถ้ามี)
  if (amount > 0) {
    const amountStr = amount.toFixed(2)
    payload += "54" + formatLength(amountStr) + amountStr
  }

  // Country Code (TH)
  payload += "5802TH"

  // ข้อมูลเพิ่มเติม (ไม่จำเป็น)
  // payload += "62" + formatLength(additionalData) + additionalData;

  // คำนวณ CRC และเพิ่มเข้าไปใน payload
  const crcPayload = payload + "6304"
  const checksum = crc16(crcPayload)
  payload = crcPayload + checksum

  return payload
}
