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

      async getPortDetails() {
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

}

const stockApi = new StockApi()

export default stockApi