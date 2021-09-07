import React, { Component } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

class App extends Component {
    handleSave() {
        console.log('Saved content:', this.state.data);
    }

    render() {
        return (
            <div className="App">
                <div className="container">
                    <h1>Editor with "Save" function</h1>

                    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                        <div className="container-fluid">
                            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                                <span className="navbar-toggler-icon"></span>
                            </button>
                            <div className="collapse navbar-collapse" id="navbarSupportedContent">
                                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                                    <li className="nav-item dropdown">
                                        <button className="nav-link dropdown-toggle btn btn-primary" id="navbarDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                            File
                                        </button>
                                        <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                                            <li><button className="dropdown-item" onClick={() => this.handleSave()}>Save</button></li>
                                        </ul>
                                    </li>
                                    <li className="nav-item dropdown">
                                        <button className="nav-link dropdown-toggle btn btn-secondary" id="navbarDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                            Edit
                                        </button>
                                        <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                                        </ul>
                                    </li>
                                    <li className="nav-item dropdown">
                                        <button className="nav-link dropdown-toggle btn btn-secondary" id="navbarDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                            View
                                        </button>
                                        <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                                        </ul>
                                    </li>
                                    <li className="nav-item dropdown">
                                        <button className="nav-link dropdown-toggle btn btn-secondary" id="navbarDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                            Help
                                        </button>
                                        <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                                        </ul>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </nav>

                    <CKEditor
                        editor={ClassicEditor}
                        data="Write something here..."
                        onReady={editor => {
                            console.log('Editor is ready to use!', editor);
                            this.editor = editor;
                            this.setState({ data: "" }) // init w empty data
                        }}
                        onChange={(event, editor) => {
                            const data = editor.getData();
                            this.setState({ data: data })
                        }}
                        onBlur={(event, editor) => {
                            console.log('Blur.', editor);
                        }}
                        onFocus={(event, editor) => {
                            console.log('Focus.', editor);
                        }}
                    />
                </div>
            </div>
        );
    }
}

export default App;
