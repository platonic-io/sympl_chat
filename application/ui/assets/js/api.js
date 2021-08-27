const api_base = "/api";
async function call_api(
  method,
  api_method,
  parameters = {},
  headers = {},
  data = ""
) {
  url = `${api_base}/${api_method}`;
  if (Object.keys(parameters).length > 0) {
    url += "?";
    params_temp = [];
    for (let key in parameters) {
      params_temp.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(
          parameters[key].replaceAll('"', "&quot;")
        )}`
      );
    }
    url += params_temp.join("&");
  }
  if (!localStorage.username && api_method !== "create_user") {
    throw new Error("Error, no username created yet");
  }
  headers["username"] = localStorage.username;

  options = {
    method: method,
    headers: headers,
  };

  if (method == "POST") {
    options.body = data;
  }

  return fetch(url, options).then(async (res) => {
    let result = await res.json();
    if (result.error) {
      if (result.error.message === "Unauthorized Request!") {
        localStorage.username = "";
        window.location.href = "/";
      }
    }
    return result;
  });
}
