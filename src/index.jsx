import React from "react";
import ReactDOM from "react-dom";

import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "./styles/main.scss";
import Editor from "./routes/Editor";
import Start from "./routes/Start";
import Login from "./routes/Login";
import Logout from "./routes/Logout";
import Register from "./routes/Register";
import Success from "./routes/Success";
import Home from "./routes/Home";

import { HashRouter as Router, Switch, Route } from "react-router-dom";

ReactDOM.render(
    <Router hashType="noslash">
        <Switch>
            <Route path="/" exact component={Start} />
            <Route path="/home" exact component={Home} />
            <Route path="/login" exact component={Login} />
            <Route path="/logout" exact component={Logout} />
            <Route path="/register" exact component={Register} />
            <Route path="/success" exact component={Success} />
            <Route path="/docs" exact component={Editor} />
            <Route path="/docs/:id" component={Editor} />
        </Switch>
    </Router>,
    document.getElementById("root")
);
