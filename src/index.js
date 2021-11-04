import React from 'react';
import ReactDOM from 'react-dom';

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import Editor from './Editor';

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

ReactDOM.render(
    <React.StrictMode>
        <Router>
            <Switch>
                <Route path="/docs" exact component={Editor} />
                <Route path="/docs/:id" exact component={Editor} />
            </Switch>
        </Router>
    </React.StrictMode>,
    document.getElementById('root')
);
