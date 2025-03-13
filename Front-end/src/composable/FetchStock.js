const API_ROOT = import.meta.env.VITE_ROOT_API;

class StockApi {
  async searchTicker(tick) {
    try {
      const res = await fetch(`${API_ROOT}/searchTickers/${tick}`);
      if (res.ok) {
        const ticker = await res.json();
        return ticker;
      } else {
        console.log(`ERROR: Server responded with status ${res.status}`);
      }
    } catch (error) {
      console.log(`ERROR cannot read data: ${error}`);
    }
  }

  async getPort() {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_ROOT}/portfolios`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const ports = await res.json();
        return ports;
      } else {
        console.log(`ERROR: Server responded with status ${res.status}`);
      }
    } catch (error) {
      console.log(`ERROR cannot read data: ${error}`);
    }
  }

  async getPortDetails(id) {
    try {
      const res = await fetch(`${API_ROOT}/portfolios/portDetails/${id}`);
      if (res.ok) {
        const ports = await res.json();
        return ports;
      } else {
        console.log(`ERROR: Server responded with status ${res.status}`);
      }
    } catch (error) {
      console.log(`ERROR cannot read data: ${error}`);
    }
  }

  async buyStock(assetObj) {
    try {
      const res = await fetch(`${API_ROOT}/buyStock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assetObj), // Ensure portfolioObj is passed here
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      } else {
        console.log(`ERROR: Server responded with status ${res.status}`);
      }
    } catch (error) {
      console.log(`ERROR cannot send data: ${error}`);
    }
  }

  async sellStock(assetObj) {
    try {
      const res = await fetch(`${API_ROOT}/sellStock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assetObj), // Ensure portfolioObj is passed here
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      } else {
        console.log(`ERROR: Server responded with status ${res.status}`);
      }
    } catch (error) {
      console.log(`ERROR cannot send data: ${error}`);
    }
  }

  async getAllTransaction(filter) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_ROOT}/getAllTransaction?${filter}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const transaction = await res.json();
        return transaction;
      } else {
        console.log(`ERROR: Server responded with status ${res.status}`);
      }
    } catch (error) {
      console.log(`ERROR cannot read data: ${error}`);
    }
  }

  async updateTransaction(id,status) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_ROOT}/updateTransaction/${id}?status=${status}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const transaction = await res.json();
        return transaction;
      } else {
        console.log(`ERROR: Server responded with status ${res.status}`);
      }
    } catch (error) {
      console.log(`ERROR cannot read data: ${error}`);
    }
  }

  async createTransaction(transactionObj) {
    try {
      const res = await fetch(`${API_ROOT}/createTransaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionObj),
      });

      if (res.ok) {
        return await res.json();
      } else {
        console.error(`ERROR: Server responded with status ${res.status}`);
      }
    } catch (error) {
      console.error(`ERROR cannot send data: ${error}`);
    }
  }

  async exportExcel(userId, year, month) {
    try {
      const res = await fetch(`http://localhost:5000/test/exportTransactions/${userId}?year=${year}&month=${month}`);
  
      if (!res.ok) {
        console.error(`ERROR: Server responded with status ${res.status}`);
        return;
      }
  
      // รับข้อมูลเป็น Blob (รองรับไฟล์ทุกประเภท รวมถึง application/octet-stream)
      const blob = await res.blob(); 
  
      // Debug: ตรวจสอบ MIME Type ว่าเป็น application/octet-stream หรือไม่
      // console.log("MIME Type from response:", blob.type);
  
      // แปลง Blob เป็น URL และดาวน์โหลดไฟล์
      const fileUrl = URL.createObjectURL(blob);
      this.downloadFile(fileUrl, `Transaction_Report_${year}_${month}.xlsx`);
    } catch (error) {
      console.error(`ERROR cannot read data: ${error}`);
    }
  }
  
  downloadFile(fileUrl, fileName) {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  
    // Cleanup URL object เพื่อป้องกัน memory leak
    URL.revokeObjectURL(fileUrl);
  }

}
const getPolygonRandomKey = () => {
  const keyPool = [
    "30mHX3fZfxe_ievjRkBlJJCjv6DvmpdU",
    "lSbd_UnlGVNSUB9ZYPFK75wQo_x3i7c8",
    "9MeS_Qv2Qx1tDnzOi5Pcv1ESd6EmN24T",
    "vlzmbTQ2faM8D81riOsvrbVSkcr2ahds",
    "LbI7H3mCXuQDiplLf76js6REu09Cq_a3",
    "9YqDV7jA5PaRqFgngWxohFtq9gyfyd20",
  ];

  // ตรวจสอบว่ามี keyIndex หรือไม่ ถ้าไม่มีให้เริ่มที่ 0
  let keyIndex = localStorage.getItem("keyIndex");
  if (keyIndex === null) {
    keyIndex = 0; // ตั้งค่าเริ่มต้นเป็น 0
  } else {
    keyIndex = Number(keyIndex); // แปลงค่าจาก string เป็น number
  }

  // ดึงค่าจาก keyPool ตาม keyIndex
  const key = keyPool[keyIndex];

  // ตรวจสอบค่า keyIndex ถ้ามากกว่าหรือเท่ากับขนาดของ keyPool - 1 ให้รีเซ็ตเป็น 0
  if (keyIndex >= keyPool.length - 1) {
    keyIndex = 0;
  } else {
    keyIndex++; // เพิ่มขึ้น 1 ทุกครั้ง
  }

  // อัปเดตค่า keyIndex ใน localStorage (แปลงเป็น string ก่อนเก็บ)
  localStorage.setItem("keyIndex", keyIndex.toString());

  return key;
};

const getTwelveDataRandomkey = () => {
  const keyPool = [
    "609e212acea948feb7450938a016c088",
    "6b589bf0b3464cddbb59539a6c3d8238",
    "bae5aebed6024ffc9bd8118d9f3ef89a",
    "ac2e2c88ebac496d90b92b225aefd4b4",
    "a812690526f24184b0347c0ce8899b8b",
    "96226cc340d647458a8ee8415757f722",
  ];

  // ตรวจสอบว่ามี keyIndex หรือไม่ ถ้าไม่มีให้เริ่มที่ 0
  let keyIndex = localStorage.getItem("keyIndex");
  if (keyIndex === null) {
    keyIndex = 0; // ตั้งค่าเริ่มต้นเป็น 0
  } else {
    keyIndex = Number(keyIndex); // แปลงค่าจาก string เป็น number
  }

  // ดึงค่าจาก keyPool ตาม keyIndex
  const key = keyPool[keyIndex];

  // ตรวจสอบค่า keyIndex ถ้ามากกว่าหรือเท่ากับขนาดของ keyPool - 1 ให้รีเซ็ตเป็น 0
  if (keyIndex >= keyPool.length - 1) {
    keyIndex = 0;
  } else {
    keyIndex++; // เพิ่มขึ้น 1 ทุกครั้ง
  }

  // อัปเดตค่า keyIndex ใน localStorage (แปลงเป็น string ก่อนเก็บ)
  localStorage.setItem("keyIndex", keyIndex.toString());

  return key;
};

const stockApi = new StockApi();

export default stockApi;
export { getPolygonRandomKey, getTwelveDataRandomkey };
