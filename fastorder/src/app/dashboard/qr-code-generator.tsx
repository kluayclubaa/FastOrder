"use client"

import { useState, useEffect, useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Download, Copy, Share, Printer } from "lucide-react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"

export default function QRCodeGenerator() {
  const [userId, setUserId] = useState<string | null>(null)
  const [tableNumber, setTableNumber] = useState("")
  const [zone, setZone] = useState("")
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [qrSize, setQrSize] = useState(300)
  const [generatedQRs, setGeneratedQRs] = useState<
    Array<{
      id: string
      table: string
      zone: string
      url: string
      createdAt: Date
    }>
  >([])
  const [showQR, setShowQR] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
        // Load previously generated QR codes from localStorage
        const savedQRs = localStorage.getItem(`qrcodes_${user.uid}`)
        if (savedQRs) {
          try {
            setGeneratedQRs(JSON.parse(savedQRs))
          } catch (e) {
            console.error("Error parsing saved QR codes", e)
          }
        }
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  // Generate QR code URL
  const generateQRUrl = () => {
    if (!userId || !tableNumber) return ""

    const baseUrl = window.location.origin
    const fullTable = zone ? `${zone}${tableNumber}` : tableNumber
    const url = `${baseUrl}/order?id=${userId}&table=${fullTable}`

    if (additionalInfo) {
      return `${url}&info=${encodeURIComponent(additionalInfo)}`
    }

    return url
  }

  // Generate QR code
  const generateQR = () => {
    if (!userId || !tableNumber) return

    const url = generateQRUrl()
    const newQR = {
      id: Date.now().toString(),
      table: tableNumber,
      zone: zone,
      url,
      createdAt: new Date(),
    }

    const updatedQRs = [newQR, ...generatedQRs]
    setGeneratedQRs(updatedQRs)

    // Save to localStorage
    localStorage.setItem(`qrcodes_${userId}`, JSON.stringify(updatedQRs))

    setShowQR(true)
  }

  // Download QR code as PNG
  const downloadQR = () => {
    if (!qrRef.current) return

    const canvas = qrRef.current.querySelector("canvas")
    if (!canvas) {
      // If canvas is not available, create one from the SVG
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
          ctx.drawImage(img, 0, 0)
          const pngFile = canvas.toDataURL("image/png")
          const downloadLink = document.createElement("a")
          const fullTable = zone ? `${zone}${tableNumber}` : tableNumber

          downloadLink.download = `qrcode-table-${fullTable}.png`
          downloadLink.href = pngFile
          downloadLink.click()
        }
      }

      img.src = `data:image/svg+xml;base64,${btoa(svgData)}`
      return
    }

    // If canvas is available, use it directly
    const pngFile = canvas.toDataURL("image/png")
    const downloadLink = document.createElement("a")
    const fullTable = zone ? `${zone}${tableNumber}` : tableNumber

    downloadLink.download = `qrcode-table-${fullTable}.png`
    downloadLink.href = pngFile
    downloadLink.click()
  }

  // Copy QR code URL to clipboard
  const copyQRUrl = () => {
    const url = generateQRUrl()
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert("คัดลอก URL สำเร็จ")
      })
      .catch((err) => {
        console.error("Error copying URL: ", err)
      })
  }

  // Share QR code
  const shareQR = () => {
    const url = generateQRUrl()
    const fullTable = zone ? `${zone}${tableNumber}` : tableNumber

    if (navigator.share) {
      navigator
        .share({
          title: `QR Code สำหรับโต๊ะ ${fullTable}`,
          text: "สแกน QR Code นี้เพื่อสั่งอาหาร",
          url,
        })
        .catch((err) => {
          console.error("Error sharing: ", err)
        })
    } else {
      alert("ไม่รองรับการแชร์บนอุปกรณ์นี้")
    }
  }

  // Print QR code
  const printQR = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const fullTable = zone ? `${zone}${tableNumber}` : tableNumber
    const url = generateQRUrl()

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code โต๊ะ ${fullTable}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
            }
            .qr-container {
              margin: 20px auto;
              max-width: 400px;
            }
            .table-info {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .instructions {
              font-size: 16px;
              margin-bottom: 20px;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            .url {
              font-size: 12px;
              word-break: break-all;
              margin-top: 10px;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="table-info">โต๊ะ ${fullTable}</div>
            <div class="instructions">สแกน QR Code เพื่อสั่งอาหาร</div>
            <div>
              <img src="${
                qrRef.current?.querySelector("svg")?.outerHTML
                  ? "data:image/svg+xml;charset=utf-8," +
                    encodeURIComponent(qrRef.current.querySelector("svg")?.outerHTML || "")
                  : ""
              }" alt="QR Code" />
            </div>
            <div class="url">${url}</div>
            <button class="no-print" style="margin-top: 20px; padding: 10px 20px;" onclick="window.print()">พิมพ์</button>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">สร้าง QR Code สำหรับโต๊ะอาหาร</h2>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </select>
            </div>

            <button
              onClick={generateQR}
              disabled={!tableNumber}
              className={`w-full py-2 rounded-md ${
                !tableNumber ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              สร้าง QR Code
            </button>
          </div>

          <div className="flex flex-col items-center justify-center">
            {showQR && (
              <div className="text-center" ref={qrRef}>
                <div className="mb-3 font-medium">
                  โต๊ะ {zone}
                  {tableNumber}
                </div>
                <QRCodeSVG value={generateQRUrl()} size={qrSize} level="H" includeMargin={true} className="mx-auto" />
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={downloadQR}
                    className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm"
                  >
                    <Download className="h-4 w-4 mr-1" /> บันทึก
                  </button>
                  <button
                    onClick={printQR}
                    className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md text-sm"
                  >
                    <Printer className="h-4 w-4 mr-1" /> พิมพ์
                  </button>
                  <button
                    onClick={copyQRUrl}
                    className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-md text-sm"
                  >
                    <Copy className="h-4 w-4 mr-1" /> คัดลอก URL
                  </button>
                  <button
                    onClick={shareQR}
                    className="flex items-center px-3 py-1.5 bg-orange-600 text-white rounded-md text-sm"
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
        <h3 className="text-lg font-bold mb-4">QR Code ที่สร้างล่าสุด</h3>

        {generatedQRs.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
              <QRCodeSVG value="empty" size={40} className="text-gray-400" />
            </div>
            <p className="text-gray-500">ยังไม่มี QR Code ที่สร้างไว้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {generatedQRs.slice(0, 6).map((qr) => (
              <div key={qr.id} className="border border-gray-200 rounded-lg p-4 text-center">
                <div className="mb-2 font-medium">
                  โต๊ะ {qr.zone}
                  {qr.table}
                </div>
                <QRCodeSVG value={qr.url} size={150} level="M" includeMargin={true} className="mx-auto" />
                <div className="mt-3 text-xs text-gray-500">{new Date(qr.createdAt).toLocaleDateString("th-TH")}</div>
                <button
                  onClick={() => {
                    setTableNumber(qr.table)
                    setZone(qr.zone)
                    setShowQR(true)
                  }}
                  className="mt-2 w-full px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                >
                  ดูรายละเอียด
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
