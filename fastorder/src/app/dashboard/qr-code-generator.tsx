"use client"

import { useState, useEffect, useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Download, Copy, Share, Printer, Trash2 } from "lucide-react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"

interface QRCodeData {
  id: string
  table: string
  zone: string
  url: string
  additionalInfo?: string
  createdAt: string // เปลี่ยนเป็น string เพื่อป้องกันปัญหาการ serialize
}

export default function QRCodeGenerator() {
  const [userId, setUserId] = useState<string | null>(null)
  const [tableNumber, setTableNumber] = useState("")
  const [zone, setZone] = useState("")
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [qrSize, setQrSize] = useState(300)
  const [generatedQRs, setGeneratedQRs] = useState<QRCodeData[]>([])
  const [showQR, setShowQR] = useState(false)
  const [currentQR, setCurrentQR] = useState<QRCodeData | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // โหลด QR Codes จาก localStorage
  const loadSavedQRs = (uid: string) => {
    try {
      const savedQRs = localStorage.getItem(`qrcodes_${uid}`)
      if (savedQRs) {
        const parsedQRs = JSON.parse(savedQRs) as QRCodeData[]
        // ตรวจสอบและแปลง createdAt ให้เป็น string หากจำเป็น
        const normalizedQRs = parsedQRs.map(qr => ({
          ...qr,
          createdAt: typeof qr.createdAt === 'string' ? qr.createdAt : new Date(qr.createdAt).toISOString()
        }))
        setGeneratedQRs(normalizedQRs)
      }
    } catch (error) {
      console.error("Error loading saved QR codes:", error)
      // หากมีข้อผิดพลาดในการโหลด ให้เริ่มต้นใหม่
      setGeneratedQRs([])
    }
  }

  // บันทึก QR Codes ไปยัง localStorage
  const saveQRs = (qrs: QRCodeData[], uid: string) => {
    try {
      localStorage.setItem(`qrcodes_${uid}`, JSON.stringify(qrs))
    } catch (error) {
      console.error("Error saving QR codes:", error)
    }
  }

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
        loadSavedQRs(user.uid)
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  // Generate QR code URL
  const generateQRUrl = (table?: string, zoneParam?: string, info?: string) => {
    if (!userId) return ""

    const currentTable = table || tableNumber
    const currentZone = zoneParam || zone
    const currentInfo = info || additionalInfo

    if (!currentTable) return ""

    const baseUrl = window.location.origin
    const fullTable = currentZone ? `${currentZone}${currentTable}` : currentTable
    let url = `${baseUrl}/order?id=${userId}&table=${fullTable}`

    if (currentInfo) {
      url += `&info=${encodeURIComponent(currentInfo)}`
    }

    return url
  }

  // Generate QR code
  const generateQR = () => {
    if (!userId || !tableNumber) return

    const url = generateQRUrl()
    const fullTable = zone ? `${zone}${tableNumber}` : tableNumber
    
    // ตรวจสอบว่า QR Code นี้มีอยู่แล้วหรือไม่
    const existingQR = generatedQRs.find(qr => qr.table === tableNumber && qr.zone === zone)
    
    if (existingQR) {
      // หากมีอยู่แล้ว ให้อัปเดตข้อมูล
      const updatedQR = {
        ...existingQR,
        url,
        additionalInfo,
        createdAt: new Date().toISOString()
      }
      
      const updatedQRs = generatedQRs.map(qr => 
        qr.id === existingQR.id ? updatedQR : qr
      )
      
      setGeneratedQRs(updatedQRs)
      setCurrentQR(updatedQR)
      saveQRs(updatedQRs, userId)
    } else {
      // สร้าง QR Code ใหม่
      const newQR: QRCodeData = {
        id: `${userId}_${fullTable}_${Date.now()}`,
        table: tableNumber,
        zone: zone,
        url,
        additionalInfo,
        createdAt: new Date().toISOString(),
      }

      const updatedQRs = [newQR, ...generatedQRs]
      setGeneratedQRs(updatedQRs)
      setCurrentQR(newQR)
      saveQRs(updatedQRs, userId)
    }

    setShowQR(true)
  }

  // ลบ QR Code
  const deleteQR = (qrId: string) => {
    if (!userId) return
    
    const updatedQRs = generatedQRs.filter(qr => qr.id !== qrId)
    setGeneratedQRs(updatedQRs)
    saveQRs(updatedQRs, userId)
    
    // หาก QR ที่กำลังแสดงถูกลบ ให้ซ่อน
    if (currentQR?.id === qrId) {
      setShowQR(false)
      setCurrentQR(null)
    }
  }

  // เลือก QR Code เพื่อแสดง
  const selectQR = (qr: QRCodeData) => {
    setTableNumber(qr.table)
    setZone(qr.zone)
    setAdditionalInfo(qr.additionalInfo || "")
    setCurrentQR(qr)
    setShowQR(true)
  }

  // Download QR code as PNG
  const downloadQR = () => {
    if (!qrRef.current || !currentQR) return

    const svg = qrRef.current.querySelector("svg")
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    canvas.width = qrSize
    canvas.height = qrSize

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, qrSize, qrSize)
        ctx.drawImage(img, 0, 0)
        
        const pngFile = canvas.toDataURL("image/png")
        const downloadLink = document.createElement("a")
        const fullTable = currentQR.zone ? `${currentQR.zone}${currentQR.table}` : currentQR.table

        downloadLink.download = `qrcode-table-${fullTable}.png`
        downloadLink.href = pngFile
        downloadLink.click()
      }
    }

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`
  }

  // Copy QR code URL to clipboard
  const copyQRUrl = () => {
    if (!currentQR) return
    
    navigator.clipboard
      .writeText(currentQR.url)
      .then(() => {
        alert("คัดลอก URL สำเร็จ")
      })
      .catch((err) => {
        console.error("Error copying URL: ", err)
        // Fallback สำหรับเบราว์เซอร์เก่า
        const textArea = document.createElement("textarea")
        textArea.value = currentQR.url
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        alert("คัดลอก URL สำเร็จ")
      })
  }

  // Share QR code
  const shareQR = () => {
    if (!currentQR) return
    
    const fullTable = currentQR.zone ? `${currentQR.zone}${currentQR.table}` : currentQR.table

    if (navigator.share) {
      navigator
        .share({
          title: `QR Code สำหรับโต๊ะ ${fullTable}`,
          text: "สแกน QR Code นี้เพื่อสั่งอาหาร",
          url: currentQR.url,
        })
        .catch((err) => {
          console.error("Error sharing: ", err)
        })
    } else {
      // Fallback สำหรับเบราว์เซอร์ที่ไม่รองรับ Web Share API
      copyQRUrl()
    }
  }

  // Print QR code
  const printQR = () => {
    if (!currentQR || !qrRef.current) return

    const fullTable = currentQR.zone ? `${currentQR.zone}${currentQR.table}` : currentQR.table
    const svg = qrRef.current.querySelector("svg")
    
    if (!svg) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const svgString = new XMLSerializer().serializeToString(svg)

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code โต๊ะ ${fullTable}</title>
          <style>
            body {
              font-family: 'Sarabun', Arial, sans-serif;
              text-align: center;
              padding: 20px;
              margin: 0;
            }
            .qr-container {
              margin: 20px auto;
              max-width: 400px;
            }
            .table-info {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #333;
            }
            .instructions {
              font-size: 18px;
              margin-bottom: 20px;
              color: #666;
            }
            .qr-code {
              margin: 20px 0;
            }
            .url {
              font-size: 10px;
              word-break: break-all;
              margin-top: 15px;
              color: #888;
            }
            .additional-info {
              font-size: 14px;
              margin-top: 10px;
              color: #555;
            }
            @media print {
              .no-print {
                display: none;
              }
              body {
                margin: 0;
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="table-info">โต๊ะ ${fullTable}</div>
            <div class="instructions">สแกน QR Code เพื่อสั่งอาหาร</div>
            ${currentQR.additionalInfo ? `<div class="additional-info">${currentQR.additionalInfo}</div>` : ''}
            <div class="qr-code">
              ${svgString}
            </div>
            <div class="url">${currentQR.url}</div>
            <button class="no-print" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;" onclick="window.print()">พิมพ์</button>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    
    // พิมพ์อัตโนมัติหลังจากโหลดเสร็จ
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">สร้าง QR Code สำหรับโต๊ะอาหาร</h2>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">โซน (ไม่บังคับ)</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
              >
                <option value="">ไม่ระบุโซน</option>
                <option value="A">โซน A</option>
                <option value="B">โซน B</option>
                <option value="C">โซน C</option>
                <option value="D">โซน D</option>
                <option value="E">โซน E</option>
                <option value="F">โซน F</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">หมายเลขโต๊ะ *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น 1, 2, 3"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">ข้อมูลเพิ่มเติม (ไม่บังคับ)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น ชื่อร้าน, ข้อความต้อนรับ"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">ขนาด QR Code</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
              >
                <option value="200">เล็ก (200x200 px)</option>
                <option value="300">กลาง (300x300 px)</option>
                <option value="400">ใหญ่ (400x400 px)</option>
                <option value="500">ใหญ่มาก (500x500 px)</option>
              </select>
            </div>

            <button
              onClick={generateQR}
              disabled={!tableNumber}
              className={`w-full py-3 rounded-md font-medium ${
                !tableNumber 
                  ? "bg-gray-300 cursor-not-allowed text-gray-500" 
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {generatedQRs.find(qr => qr.table === tableNumber && qr.zone === zone) 
                ? "อัปเดต QR Code" 
                : "สร้าง QR Code"}
            </button>
          </div>

          <div className="flex flex-col items-center justify-center">
            {showQR && currentQR && (
              <div className="text-center" ref={qrRef}>
                <div className="mb-3 font-medium text-lg">
                  โต๊ะ {currentQR.zone}{currentQR.table}
                </div>
                {currentQR.additionalInfo && (
                  <div className="mb-3 text-sm text-gray-600">
                    {currentQR.additionalInfo}
                  </div>
                )}
                <QRCodeSVG 
                  value={currentQR.url} 
                  size={qrSize} 
                  level="H" 
                  includeMargin={true} 
                  className="mx-auto border border-gray-200 rounded-lg" 
                />
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={downloadQR}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-1" /> บันทึก
                  </button>
                  <button
                    onClick={printQR}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                  >
                    <Printer className="h-4 w-4 mr-1" /> พิมพ์
                  </button>
                  <button
                    onClick={copyQRUrl}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                  >
                    <Copy className="h-4 w-4 mr-1" /> คัดลอก URL
                  </button>
                  <button
                    onClick={shareQR}
                    className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700"
                  >
                    <Share className="h-4 w-4 mr-1" /> แชร์
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">QR Code ทั้งหมด ({generatedQRs.length})</h3>
          {generatedQRs.length > 0 && (
            <div className="text-sm text-gray-500">
              จัดเก็บอย่างถาวรในเครื่องของคุณ
            </div>
          )}
        </div>

        {generatedQRs.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 p-6 rounded-full inline-block mb-4">
              <QRCodeSVG value="placeholder" size={60} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">ยังไม่มี QR Code ที่สร้างไว้</p>
            <p className="text-gray-400 text-sm mt-2">สร้าง QR Code แรกของคุณด้านบน</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {generatedQRs.map((qr) => (
              <div key={qr.id} className="border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                <div className="mb-2 font-medium text-lg">
                  โต๊ะ {qr.zone}{qr.table}
                </div>
                {qr.additionalInfo && (
                  <div className="mb-2 text-xs text-gray-600 truncate">
                    {qr.additionalInfo}
                  </div>
                )}
                <QRCodeSVG 
                  value={qr.url} 
                  size={120} 
                  level="M" 
                  includeMargin={true} 
                  className="mx-auto mb-3" 
                />
                <div className="text-xs text-gray-500 mb-3">
                  {new Date(qr.createdAt).toLocaleDateString("th-TH", {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => selectQR(qr)}
                    className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm hover:bg-blue-100"
                  >
                    ดูรายละเอียด
                  </button>
                  <button
                    onClick={() => deleteQR(qr.id)}
                    className="px-2 py-1.5 bg-red-50 text-red-600 rounded-md text-sm hover:bg-red-100"
                    title="ลบ QR Code"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}