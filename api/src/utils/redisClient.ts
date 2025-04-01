import * as redis from "redis";
import { promisify } from "util";

const client = redis.createClient({
  url: process.env.REDIS_HOST || "localhost"
});

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);

client.on("connect", () => {
  console.log("Connected to Redis");
});

client.on("error", (error) => {
  console.error("Redis Error:", error);
});

export {
  client,
  getAsync,
  setAsync,
  delAsync,
};
