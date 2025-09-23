import axios from "axios";

export class UrlStatus {
  type: "ok" | "redirect" | "client_error" | "server_error";
  status: number;
  location?: string;
  message?: string | undefined;

  constructor(
    type: "ok" | "redirect" | "client_error" | "server_error",
    status: number,
    message?: string
  ) {
    this.type = type;
    this.status = status;
    this.message = message;
  }

  get isOk() {
    return this.type === "ok";
  }

  get isRedirect() {
    return this.type === "redirect";
  }

  get isClientError() {
    return this.type === "client_error";
  }

  get isServerError() {
    return this.type === "server_error";
  }

  setLocation(location: string) {
    this.location = location;
  }
}

/**
 * Gets a status code for a give URL
 *
 * @param {string} url
 * @returns {Promise<UrlStatus>}
 */
export async function getUrlStatus(url: string) {
  const res = await axios.get(url, { maxRedirects: 0, validateStatus: null });

  if (res.status >= 300 && res.status < 400 && res.headers.location) {
    return new UrlStatus("redirect", res.status).setLocation(
      res.headers.location
    );
  } else if (res.status >= 400 && res.status < 500) {
    return new UrlStatus("client_error", res.status);
  } else if (res.status >= 500) {
    return new UrlStatus("server_error", res.status);
  } else {
    return new UrlStatus("ok", res.status);
  }
}
