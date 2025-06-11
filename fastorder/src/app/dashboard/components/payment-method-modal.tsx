"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, QrCode, CreditCard, Upload, Check } from "lucide-react"
import QRCodeGenerator from "qrcode"

type PaymentMethodModalProps = {
  isOpen: boolean
  onClose: () => void
  onSelectPayment: (method: "scan" | "counter") => void
  restaurantPromptPayID?: string
  dynamicQRCodeData: string
  totalAmount: number
  onReceiptUpload: (file: File) => Promise<string | undefined>
  isUploading: boolean
}

export default function PaymentMethodModal({
  isOpen,
  onClose,
  onSelectPayment,
  restaurantPromptPayID,
  dynamicQRCodeData,
  totalAmount,
  onReceiptUpload,
  isUploading,
}: PaymentMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<"scan" | "counter" | null>(null)
  const [showQRCode, setShowQRCode] = useState(false)
  const [receiptUploaded, setReceiptUploaded] = useState(false)
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("")

  // Generate QR code when dynamicQRCodeData changes
  useEffect(() => {
    if (dynamicQRCodeData && showQRCode) {
      QRCodeGenerator.toDataURL(dynamicQRCodeData, {
        width: 256,
        margin: 1,
        errorCorrectionLevel: "M",
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
        .then((url) => {
          setQrCodeDataURL(url)
          console.log("QR code generated successfully")
        })
        .catch((err) => {
          console.error("Error generating QR code:", err)
          setQrCodeDataURL("")
        })
    }
  }, [dynamicQRCodeData, showQRCode])

  if (!isOpen) return null

  const handleMethodSelect = (method: "scan" | "counter") => {
    setSelectedMethod(method)
    if (method === "counter") {
      onSelectPayment(method)
      onClose()
    } else if (method === "scan" && restaurantPromptPayID) {
      setShowQRCode(true)
    }
  }

  const handleReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        await onReceiptUpload(file)
        setReceiptUploaded(true)
      } catch (error) {
        console.error("Error uploading receipt:", error)
      }
    }
  }

  const handleConfirmScanPayment = () => {
    if (receiptUploaded) {
      onSelectPayment("scan")
      onClose()

      // Reset state for next time the modal opens
      setReceiptUploaded(false)
      setShowQRCode(false)
      setSelectedMethod(null)
      setQrCodeDataURL("")
    }
  }

  const handleClose = () => {
    // Reset all states when closing the modal
    setSelectedMethod(null)
    setShowQRCode(false)
    setReceiptUploaded(false)
    setQrCodeDataURL("")
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">เลือกวิธีการชำระเงิน</h3>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          {!showQRCode ? (
            <div className="space-y-4">
              {/* Total Amount Display */}
              <div className="text-center py-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <p className="text-sm text-gray-600 mb-1">ยอดรวมที่ต้องชำระ</p>
                <p className="text-3xl font-bold text-blue-600">฿{totalAmount.toFixed(2)}</p>
              </div>

              {/* Scan Payment Option */}
              <button
                onClick={() => handleMethodSelect("scan")}
                disabled={!restaurantPromptPayID}
                className={`w-full p-4 border-2 rounded-xl transition-all ${
                  !restaurantPromptPayID
                    ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                    : "border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-full mr-4 ${!restaurantPromptPayID ? "bg-gray-200" : "bg-blue-100"}`}>
                    <QrCode className={`h-6 w-6 ${!restaurantPromptPayID ? "text-gray-400" : "text-blue-600"}`} />
                  </div>
                  <div className="text-left">
                    <h4 className={`font-bold ${!restaurantPromptPayID ? "text-gray-400" : "text-gray-800"}`}>
                      สแกนจ่าย
                    </h4>
                    <p className={`text-sm ${!restaurantPromptPayID ? "text-gray-400" : "text-gray-600"}`}>
                      {!restaurantPromptPayID ? "ร้านยังไม่ได้ตั้งค่า PromptPay ID" : "สแกน QR Code เพื่อชำระเงิน"}
                    </p>
                  </div>
                </div>
              </button>

              {/* Counter Payment Option */}
              <button
                onClick={() => handleMethodSelect("counter")}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all"
              >
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full mr-4">
                    <CreditCard className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-800">จ่ายที่เคาเตอร์</h4>
                    <p className="text-sm text-gray-600">ชำระเงินที่เคาเตอร์เมื่อรับอาหาร</p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* QR Code Display */}
              <div className="text-center">
                <h4 className="font-bold mb-4">สแกน QR Code เพื่อชำระเงิน</h4>

                {/* Total Amount Display */}
                <div className="mb-4 py-3 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">ยอดรวมที่ต้องชำระ</p>
                  <p className="text-2xl font-bold text-blue-600">฿{totalAmount.toFixed(2)}</p>
                </div>

                <div className="bg-white p-4 border-2 border-gray-200 rounded-xl inline-block">
                  {qrCodeDataURL ? (
                    <img
                      src={qrCodeDataURL || "/placeholder.svg"}
                      alt="Payment QR Code"
                      className="w-64 h-64 object-contain"
                    />
                  ) : (
                    <div className="w-64 h-64 flex items-center justify-center bg-gray-100 text-gray-400">
                      {dynamicQRCodeData ? (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
                          <p className="text-sm">กำลังสร้าง QR Code...</p>
                        </div>
                      ) : (
                        "ไม่สามารถสร้าง QR Code ได้"
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">สแกน QR Code ด้วยแอปธนาคารของคุณ</p>
              </div>

              {/* Receipt Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <h5 className="font-medium mb-3">อัพโหลดหลักฐานการโอนเงิน</h5>

                {!receiptUploaded ? (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <div className="text-center py-4">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {isUploading ? "กำลังอัพโหลด..." : "คลิกเพื่อเลือกรูปหลักฐานการโอนเงิน"}
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="text-center py-4">
                    <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-green-600">อัพโหลดหลักฐานเรียบร้อย</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowQRCode(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                >
                  กลับ
                </button>
                <button
                  onClick={handleConfirmScanPayment}
                  disabled={!receiptUploaded || isUploading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ยืนยันการชำระเงิน
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
