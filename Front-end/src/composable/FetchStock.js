class StockApi{
    async searchTicker(tick) {
        try {
          const res = await fetch(`http://localhost:5000/stock/searchFromTic/${tick}`);
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
        try {
          const res = await fetch(`http://localhost:5000/stock/getPort`);
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
          const res = await fetch(`http://localhost:5000/stock/getPortDetails/${id}`);
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
          const res = await fetch(`http://localhost:5000/stock/buyStock`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assetObj)  // Ensure portfolioObj is passed here
        })
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
          const res = await fetch(`http://localhost:5000/stock/sellStock`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assetObj)  // Ensure portfolioObj is passed here
        })
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
}

const stockApi = new StockApi()

export default stockApi