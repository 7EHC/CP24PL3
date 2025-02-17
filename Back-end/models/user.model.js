import db from "../config/database.js";

const userCollection = db.collection("user");

export const findUserByUsername = async (username) => {
  return userCollection.findOne({ username });
};

export const createUser = async (user) => {
  return userCollection.insertOne(user);
};
