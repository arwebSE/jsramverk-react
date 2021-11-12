import React from 'react';
import ReactDOM from 'react-dom';

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './styles/main.scss';
import Editor from './routes/Editor.jsx';
import Home from './routes/Home.jsx';
import Login from './routes/Login.jsx';
import Logout from './routes/Logout.jsx';
import Register from './routes/Register.jsx';
import Success from './routes/Success.jsx';

import { HashRouter as Router, Switch, Route } from 'react-router-dom';

ReactDOM.render(
    <React.StrictMode>
        <Router hashType="noslash">
            <Switch>
                <Route path="/" exact component={Home} />
                <Route path="/home" exact component={Home} />
                <Route path="/login" exact component={Login} />
                <Route path="/logout" exact component={Logout} />
                <Route path="/register" exact component={Register} />
                <Route path="/success" exact component={Success} />
                <Route path="/docs" exact component={Editor} />
                <Route path="/docs/:id" component={Editor} />
            </Switch>
        </Router>
    </React.StrictMode>,
    document.getElementById('root')
);
