import authApi from "./Auth";
const API_ROOT = import.meta.env.VITE_ROOT_API;

class StockApi {
  async searchTicker(tick) {
    try {
      const res = await fetch(`${API_ROOT}/api/searchTickers/${tick}`);
      if (res.ok) {
        const ticker = await res.json();
        return ticker;
      } else if (res.status === 401) {
        const newToken = await authApi.refreshToken();
        if (newToken && newToken !== "Failed to refresh token") {
          localStorage.setItem("token", newToken);
        }
      } else {
        console.log(`ERROR: Server responded with status ${res.status}`);
      }
    } catch (error) {
      console.log(`ERROR cannot read data: ${error}`);
    }
  }

  async getTickerInfo(tick) {
    try {
      const res = await fetch(`${API_ROOT}/api/getTicker/${tick}`);
      if (res.ok) {
        const ticker = await res.json();
        return ticker;
      } else if (res.status === 401) {
        const newToken = await authApi.refreshToken();
        if (newToken && newToken !== "Failed to refresh token") {
          localStorage.setItem("token", newToken);
        }
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
      const res = await fetch(`${API_ROOT}/api/portfolios`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const ports = await res.json();
        return ports;
      } else if (res.status === 401) {
        const newToken = await authApi.refreshToken();
        if (newToken && newToken !== "Failed to refresh token") {
          localStorage.setItem("token", newToken);
        }
      } else {
        console.log(`ERROR: Server responded with status ${res.status}`);
      }
    } catch (error) {
      console.log(`ERROR cannot read data: ${error}`);
    }
  }

  async getPortDetails(id) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_ROOT}/api/portfolios/portDetails/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const ports = await res.json();
        return ports;
      } else if (res.status === 401) {
        const newToken = await authApi.refreshToken();
        if (newToken && newToken !== "Failed to refresh token") {
          localStorage.setItem("token", newToken);
        }
      } else {
        console.log(`ERROR: Server responded with status ${res.status}`);
      }
    } catch (error) {
      console.log(`ERROR cannot read data: ${error}`);
    }
  }

  async buyStock(assetObj) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_ROOT}/api/buyStock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(assetObj), // Ensure portfolioObj is passed here
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      } else if (res.status === 401) {
        const newToken = await authApi.refreshToken();
        if (newToken && newToken !== "Failed to refresh token") {
          localStorage.setItem("token", newToken);
        }
      } else {
        console.log(`ERROR: Server responded with status ${res.status}`);
      }
    } catch (error) {
      console.log(`ERROR cannot send data: ${error}`);
    }
  }

  async sellStock(assetObj) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_ROOT}/api/sellStock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(assetObj), // Ensure portfolioObj is passed here
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      } else if (res.status === 401) {
        const newToken = await authApi.refreshToken();
        if (newToken && newToken !== "Failed to refresh token") {
          localStorage.setItem("token", newToken);
        }
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
      const res = await fetch(`${API_ROOT}/api/getAllTransaction?${filter}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const transaction = await res.json();
        return transaction;
      } else if (res.status === 401) {
        const newToken = await authApi.refreshToken();
        if (newToken && newToken !== "Failed to refresh token") {
          localStorage.setItem("token", newToken);
        }
      } else {  
        console.log(`ERROR: Server responded with status ${res.status}`);
      }
    } catch (error) {
      console.log(`ERROR cannot read data: ${error}`);
    }
  }

  async updateTransaction(id, status) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${API_ROOT}/api/updateTransaction/${id}?status=${status}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.ok) {
        const transaction = await res.json();
        return transaction;
      } else if (res.status === 401) {
        const newToken = await authApi.refreshToken();
        if (newToken && newToken !== "Failed to refresh token") {
          localStorage.setItem("token", newToken);
        }
      } else {
        console.log(`ERROR: Server responded with status ${res.status}`);
      }
    } catch (error) {
      console.log(`ERROR cannot read data: ${error}`);
    }
  }

  async createTransaction(transactionObj) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_ROOT}/api/createTransaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(transactionObj),
      });

      if (res.ok) {
        return await res.json();
      } else if (res.status === 401) {
        const newToken = await authApi.refreshToken();
        if (newToken && newToken !== "Failed to refresh token") {
          localStorage.setItem("token", newToken);
        }
      } else {
        console.error(`ERROR: Server responded with status ${res.status}`);
      }
    } catch (error) {
      console.error(`ERROR cannot send data: ${error}`);
    }
  }

  async exportExcel(userId, year, month) {
    try {
      const res = await fetch(
        `${API_ROOT}/report/exportTransactions/${userId}?year=${year}&month=${month}`
      );
  
      if (!res.ok) {
        console.error(`ERROR: Server responded with status ${res.status}`);
        return;
      }
  
      const contentType = res.headers.get("Content-Type");
      if (!contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
        const errorText = await res.text();
        console.error("Expected Excel file, but got:", contentType);
        console.error("Response content:", errorText.slice(0, 300));
        return;
      }
  
      const blob = await res.blob();
      console.log("Blob size:", blob.size);
  
      const fallbackYear = year || new Date().getFullYear();
      const fallbackMonth = month || new Date().getMonth() + 1;
      const fileUrl = URL.createObjectURL(blob);
      this.downloadFile(fileUrl, `Transaction_Report_${fallbackYear}_${fallbackMonth}.xlsx`);
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

  async getUserDetails(userId) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_ROOT}/api/userDetails/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const user = await res.json();
        return user;
      } else if (res.status === 401) {
        const newToken = await authApi.refreshToken();
        if (newToken && newToken !== "Failed to refresh token") {
          localStorage.setItem("token", newToken);
        }
      } else {
        console.log(`ERROR: Server responded with status ${res.status}`);
      }
    } catch (error) {
      console.log(`ERROR cannot read data: ${error}`);
    }
  }

  async deletePortfolio(portId) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_ROOT}/api/portfolios/delete/${portId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      } else if (res.status === 401) {
        const newToken = await authApi.refreshToken();
        if (newToken && newToken !== "Failed to refresh token") {
          localStorage.setItem("token", newToken);
        }
      } else {
        const error = await res.json();
        return error
        // console.log(`ERROR: Server responded with status ${res.status}: ${res.statusText}`);
      }
    } catch (error) {
      console.log(`ERROR cannot send data: ${error}`);
    }
  }

  async updatePortfolioName(portId, portName) {
    // console.log(portName);

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_ROOT}/api/portfolios/update/${portId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ portfolio_name: portName }),
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      } else if (res.status === 401) {
        const newToken = await authApi.refreshToken();
        if (newToken && newToken !== "Failed to refresh token") {
          localStorage.setItem("token", newToken);
        }
      } else {
        const error = await res.json();
        return error
        // console.log(`ERROR: Server responded with status ${res.status}`);
      }
    } catch (error) {
      console.log(`ERROR cannot send data: ${error}`);
    }
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
