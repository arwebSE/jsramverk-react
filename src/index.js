import React from 'react';
import ReactDOM from 'react-dom';

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import Editor from './Routes/Editor';
import Home from './Routes/Home';

import { HashRouter as Router, Switch, Route } from 'react-router-dom';

ReactDOM.render(
    <React.StrictMode>
        <Router hashType="noslash">
            <Switch>
                <Route path="/" exact component={Home} />
                <Route path="/docs" exact component={Editor} />
                <Route path="/docs/:id" component={Editor} />
            </Switch>
        </Router>
    </React.StrictMode>,
    document.getElementById('root')
);
