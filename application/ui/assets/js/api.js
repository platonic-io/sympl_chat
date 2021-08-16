/*fetch("/api/create_user?username=bob1", {
    method: "post"
}).then( (res) => {
    return res.json();
}).then((data) => {
    console.log(data)
})*/

const api_base = "/api"
async function call_api(method, api_method, parameters={}, headers={}, data="") {
    url = `${api_base}/${api_method}`
    if(Object.keys(parameters).length >0) {
        url += '?';
        params_temp = []
        for(let key in parameters) {
            params_temp.push(`${key}=${parameters[key]}`)
        }
        url += params_temp.join('&')
    }
    if( (!localStorage.username) && method !== "create_user") {
        throw new Error("Error, no username created yet")
    }
    headers["username"] = localStorage.username;

    return fetch(url, {
        method: method,
        headers: headers,
        body: data
    }).then((res) => {
        let result = res.json()
        return result;
    })
}