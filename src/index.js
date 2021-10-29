import React from 'react';
import ReactDOM from 'react-dom';

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import Editor from './Editor';

import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { v4 as uuid } from 'uuid';

ReactDOM.render(
    <React.StrictMode>
        <Router>
            <Switch>
                <Route path="/" exact>
                    <Redirect to={`/docs/${uuid()}`}></Redirect>
                </Route>
                <Route path="/docs/:id" exact component={Editor} />
            </Switch>
        </Router>
    </React.StrictMode>,
    document.getElementById('root')
);
