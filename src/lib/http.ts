import axios from "axios";

enum HttpProtocol {
  Http = "http",
  Https = "https",
  Unreachable = "unreachable",
}

/**
 * Gets the HTTP protocol for a given URL
 *
 * @param {string} url
 * @returns {Promise<HttpProtocol>}
 */
export async function getHttpProtocol(url: string) {
  try {
    await axios.get(`https://${url}`, { timeout: 5000 });
    return HttpProtocol.Https;
  } catch (err) {
    try {
      await axios.get(`http://${url}`, { timeout: 5000 });
      return HttpProtocol.Http;
    } catch {
      return HttpProtocol.Unreachable;
    }
  }
}

/**
 * Gets the HTTP protocol for a given URL
 *
 * @param {string} url
 * @returns {Promise<string}
 */
export async function getFullUrlWithProtocol(url: string) {
  switch (await getHttpProtocol(url)) {
    case HttpProtocol.Https:
      return `https://${url}`;
    case HttpProtocol.Http:
      return `http://${url}`;
    default:
      throw new Error("Unreachable");
  }
}
