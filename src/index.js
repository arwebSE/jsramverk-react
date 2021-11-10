import React from 'react';
import ReactDOM from 'react-dom';

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './styles/index.css';
import Editor from './Routes/Editor';
import Home from './Routes/Home';
import Login from './Routes/Login.jsx';
import Register from './Routes/Register.jsx';
import Success from './Routes/Success.jsx';

import { HashRouter as Router, Switch, Route } from 'react-router-dom';

ReactDOM.render(
    <React.StrictMode>
        <Router hashType="noslash">
            <Switch>
                <Route path="/" exact component={Home} />
                <Route path="/login" exact component={Login} />
                <Route path="/register" exact component={Register} />
                <Route path="/success" exact component={Success} />
                <Route path="/docs" exact component={Editor} />
                <Route path="/docs/:id" component={Editor} />
            </Switch>
        </Router>
    </React.StrictMode>,
    document.getElementById('root')
);
