require("dotenv").config();

let apiUrl;
if (process.env.NODE_ENV === "development") {
    console.log("=> Dev Mode!");
    apiUrl = "http://localhost:1337";
} else {
    apiUrl = "https://jsramverk-editor-auro17.azurewebsites.net";
    //apiUrl = "https://jsramverk-api.arwebse.repl.co";
}
const TOKEN_INTERVAL = 250000;

const getUsername = async (locationState) => {
    console.log("locationState:", locationState);
    let username = localStorage.getItem("username");
    console.log("=> Stored username:", username);
    if (username === null) {
        console.log("Looking for loc props...", locationState);
        if (locationState !== undefined) {
            const data = {
                username: locationState.username,
                accessToken: locationState.accessToken,
                refreshToken: locationState.refreshToken,
            };
            localStorage.setItem("username", locationState.username);
            localStorage.setItem("accessToken", locationState.accessToken); // UNSECURE
            localStorage.setItem("refreshToken", locationState.refreshToken); // UNSECURE
            console.log(
                "Got loc props! Set username to:",
                locationState.username,
                "and saved tokens to LS. (unsecure)"
            );
            return data;
        } else {
            console.log("Couldn't get loc props and not logged in. Back to login...", username);
            window.location.href = "/#login";
        }
    } else {
        // UNSECURE
        const data = {
            username: localStorage.getItem("username"),
            accessToken: localStorage.getItem("accessToken"),
            refreshToken: localStorage.getItem("refreshToken"),
        };
        return data;
    }
    return false;
};

const autoRefreshToken = async () => {
    if (localStorage.getItem("refreshToken") !== null) return;

    setInterval(async () => {
        return await refreshAccessToken();
    }, TOKEN_INTERVAL);
};

const refreshAccessToken = async () => {
    if (localStorage.getItem("refreshToken") !== null) {
        let refreshToken = localStorage.getItem("refreshToken");
        console.log("=> Requesting to refresh accessToken...");
        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: refreshToken }),
        };
        fetch(`${apiUrl}/token`, requestOptions)
            .then(async (response) => {
                const isJson = response.headers.get("content-type")?.includes("application/json");
                const data = isJson && (await response.json());

                if (!response.ok) {
                    const error = (data && data.message) || response.status;
                    console.log("Error refreshing token", data);
                    return Promise.reject(error);
                }
                console.log("<= Successfully refreshed AccessToken!");
                localStorage.setItem("accessToken", data.accessToken);
                return data.accessToken;
            })
            .catch((error) => {
                console.error("Error refreshing atoken!", error);
            });
    } else {
        console.log("RefreshToken is null!! this shudnt happen");
    }
};

const logout = async () => {
    console.log("Logging out...");
    if (localStorage.getItem("refreshToken") !== null) {
        console.log("Deleting LocalStorage...");
        localStorage.clear();
        console.log("Requesting to remove rftoken:", this.state.refreshToken);
        const requestOptions = {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: this.state.username, token: this.state.refreshToken }),
        };
        fetch(`${apiUrl}/logout`, requestOptions)
            .then(async (response) => {
                const isJson = response.headers.get("content-type")?.includes("application/json");
                const data = isJson && (await response.json());

                if (!response.ok) {
                    const error = (data && data.message) || response.status;
                    this.showAlert(data);
                    return Promise.reject(error);
                }
                console.log("Successfully removed rftoken!");
                console.log("Navigating to logout page...");
                window.location.href = "#logout";
            })
            .catch((error) => {
                console.error("Error logging out!", error);
            });
    } else {
        console.log("Deleting LocalStorage...");
        localStorage.clear();
        console.log("RefreshToken not set. Skipping DELETE request.");
    }
    console.log("Navigating to logout page...");
    window.location.href = "#logout";
};

export { getUsername, autoRefreshToken, refreshAccessToken, logout };
