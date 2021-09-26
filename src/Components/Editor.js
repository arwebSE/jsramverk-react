import React, { Component } from 'react';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

import { FaGithub } from 'react-icons/fa'

import { Modal, Button, DropdownButton, Dropdown } from 'react-bootstrap'

let saveData = "";

class Editor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            isLoaded: false,
            items: [],
            modalShown: false
        }
        this.showModal = this.showModal.bind(this)
        this.hideModal = this.hideModal.bind(this)
    }

    showModal = () => { this.setState({ modalShown: true }) }
    hideModal = () => { this.setState({ modalShown: false }) }

    componentDidMount() {
        fetch("https://jsramverk-editor-auro17.azurewebsites.net/docs/list")
            .then(res => res.json())
            .then(
                (result) => { this.setState({ isLoaded: true, items: result }) },
                (error) => { this.setState({ isLoaded: true, error }) }
            )
    }

    render() {
        const saveContent = () => { console.log('Saved content:', saveData) }
        const { error, isLoaded, items } = this.state;
        if (error) {
            console.log(`Error: ${error.message}`)
        } else if (isLoaded) {
            console.log("Content loaded:", items)
        }

        return (
            <div className="Editor">
                <h1>Editor with "Save" function</h1>

                <nav className="toolbar navbar navbar-expand-lg navbar-dark bg-dark">
                    <div className="container-fluid">
                        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                            <span className="navbar-toggler-icon"></span>
                        </button>
                        <div className="collapse navbar-collapse" id="navbarSupportedContent">
                            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                                <DropdownButton title="File">
                                    <Dropdown.Item onClick={saveContent}>Save</Dropdown.Item>
                                    <Dropdown.Item onClick={this.showModal}>Open...</Dropdown.Item>
                                </DropdownButton>
                                <DropdownButton title="Edit" variant="secondary"> </DropdownButton>
                                <DropdownButton title="View" variant="secondary"> </DropdownButton>
                                <DropdownButton title="Help" variant="secondary"> </DropdownButton>
                            </ul>
                            <form className="d-flex">
                                <Button variant="success" href="https://github.com/arwebSE/jsramverk-react">GitHub <FaGithub /></Button>
                            </form>
                        </div>
                    </div>
                </nav>

                <CKEditor
                    editor={ClassicEditor}
                    data="Write something here..."
                    onChange={(event, editor) => { saveData = editor.getData(); }}
                />

                <Modal show={this.state.modalShown} onHide={this.hideModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>Open Document</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div>
                            {this.state.items.map(function (item, index) {
                                return <li key={item._id}>{item.name} is the company name, {item._id} is the ID</li>
                            })}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="primary" onClick={this.hideModal}>Close</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        )
    }
}

export default Editor;
