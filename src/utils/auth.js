require("dotenv").config();

let apiUrl;
if (process.env.NODE_ENV === "development") {
    console.log("=> Dev Mode!");
    apiUrl = "http://localhost:1337";
} else {
    apiUrl = process.env.API_URL;
}
const TOKEN_INTERVAL = 250000;

const getLogin = () => {
    let username = localStorage.getItem("username");
    console.log("=> Stored username:", username);
    if (username === null) {
        console.log("Couldn't get username from localStorage. Redirecting back to login...", username);
        window.location.href = "/#login";
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
        console.log("RefreshToken is null! This shouldn't happen!");
    }
    return;
};

const logout = async () => {
    console.log("Logging out...");
    if (localStorage.getItem("refreshToken") !== null) {
        let username = localStorage.getItem("username");
        let rftoken = localStorage.getItem("refreshToken");
        console.log("Requesting to remove rftoken:", rftoken);
        const requestOptions = {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, token: rftoken }),
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
            })
            .catch((error) => {
                console.error("Error logging out!", error);
            });
    } else {
        console.log("RefreshToken not set. Skipping DELETE request.");
    }
    console.log("Deleting LocalStorage...");
    localStorage.clear();
    console.log("Navigating to logout page...");
    window.location.href = "/#logout";
};

export { getLogin, autoRefreshToken, refreshAccessToken, logout };
