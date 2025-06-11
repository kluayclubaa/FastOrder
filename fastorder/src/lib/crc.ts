/**
 * Calculate CRC-16/CCITT-FALSE checksum
 * This is the algorithm used by PromptPay QR codes
 * 
 * @param str - Input string to calculate CRC for
 * @returns CRC-16 checksum as a 4-character hexadecimal string
 */
export function crc16(str: string): string {
  // CRC-16/CCITT-FALSE parameters
  const polynomial = 0x1021;
  let crc = 0xFFFF;
  
  // Convert string to byte array
  const bytes = new TextEncoder().encode(str);
  
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    crc ^= (byte << 8);
    
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  
  // Convert to 4-character hex string
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
