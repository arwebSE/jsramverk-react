import React from 'react';
import ReactDOM from 'react-dom';

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import Editor from './Editor'

ReactDOM.render(
    <React.StrictMode>
        <Editor />
    </React.StrictMode>,
    document.getElementById('root')
);
