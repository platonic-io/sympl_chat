window.addEventListener('load',(e) => {
 
    document.querySelector("#btnGo").onclick = async (e) => {
        let potential_username = document.querySelector("#inputUsername").value;
        let response = await call_api(method="post", api_method="create_user", headers={"username":potential_username})
        if(response.username) {
            if(response.username == potential_username) {
                localStorage.username = response.username;
                window.location.href = "/room"
            }
        }
    }
    console.log("domcontentloaded")

})