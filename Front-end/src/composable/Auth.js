const API_ROOT = import.meta.env.VITE_ROOT_API;

class Auth {
  async register(username, password) {
    try {
      const res = await fetch(`${API_ROOT}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        return data;
      } else {
        const error = await res.text();
        return error;
      }
    } catch (err) {
      console.error("Registration Error:", err);
      throw err;
    }
  }

  async verify(token) {
    try {
      const res = await fetch(`http://localhost:5000/verify/verify-email?token=${token}`, {
        method: "GET", // Change to GET
        headers: {
          "Content-Type": "application/json", // You can still keep the headers, though they are not required for GET requests
        },
      });
  
      if (res.ok) {
        const data = await res.json();
        return data;
      } else {
        const error = await res.text();
        return error;
      }
    } catch (err) {
      console.error("Verification Error:", err);
      throw err;
    }
  }

  async login(username, password) {
    try {
      const res = await fetch(`${API_ROOT}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      } else {
        const error = await res.text();
        throw new Error(error);
      }
    } catch (err) {
      console.log("Login Error:", err);
      throw err;
    }
  }
}

const decodeToken = (token) => {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch (error) {
    console.error("Invalid Token:", error);
    return null;
  }
};

const authApi = new Auth();

export default authApi;
export { decodeToken }
