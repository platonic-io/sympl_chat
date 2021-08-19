async function create_user(e) {
    let potential_username = document.querySelector("#inp-username").value;
    let response = await call_api(method="post", api_method="create_user", headers={"username":potential_username})
    if(response.username) {
        if(response.username == potential_username) {
            localStorage.username = response.username;
            window.location.href = "/room"
        }
    } else if(response.error) {
        let error = document.createElement("p");
        error.style.color = "tomato";
        error.innerHTML = "Error: " + response.error.message;
        let holder = document.querySelector("#input-holder")
        let username = document.querySelector("#inp-username")
        holder.insertBefore(error, username);
    }
}

window.addEventListener('load',(e) => {
    document.querySelector("#btn-go").addEventListener('click', create_user)
    document.querySelector("#inp-username").addEventListener('keypress', (e) => {
        if(e.keyCode === 13) {
            create_user(e);
        }
    })

})