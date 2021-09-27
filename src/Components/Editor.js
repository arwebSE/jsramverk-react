import React, { Component } from 'react';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

import { FaGithub } from 'react-icons/fa'

import { Modal, Button, DropdownButton, Dropdown, Table } from 'react-bootstrap'

class Editor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            apiLoaded: false,
            documents: [],
            modalShown: false,
            selectedDoc: null,
            editData: null,
            saveData: null
        }
        this.showModal = this.showModal.bind(this)
        this.hideModal = this.hideModal.bind(this)
    }

    componentDidMount() {
        fetch("https://jsramverk-editor-auro17.azurewebsites.net/docs/list")
            .then(res => res.json())
            .then(
                (result) => { 
                    this.setState({ apiLoaded: true, documents: result })
                    console.log("API data fethed successfully!");
                },
                (error) => { 
                    this.setState({ apiLoaded: true, error })
                    console.log("API fetch error:", error);
                }
            )
    }

    showModal = () => { this.setState({ modalShown: true }) }
    hideModal = () => { this.setState({ modalShown: false }) }

    saveContent = () => { 
        console.log("Saved:", this.state.editData)
        this.setState({ saveData: this.state.editData })
    }

    selectDoc = (e, docid) => {
        e.preventDefault(); // prevents firing before click
        this.setState({ selectedDoc: docid })
        console.log('Selected doc:', docid)
    }

    getDocContent = () => {
        let docid = this.state.selectedDoc
        let doc = this.state.documents[docid]
        return doc.content
    }

    render() {
        const { error, documents, modalShown } = this.state;

        if (error) {
            console.log("Error:", error.message)
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
                                    <Dropdown.Item onClick={this.saveContent}>Save</Dropdown.Item>
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
                    data={this.getDocContent}
                    onChange={(event, editor) => { this.setState({ editData: editor.getData() }) }}
                />

                <Modal show={modalShown} onHide={this.hideModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>Open Document</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Table striped bordered hover>
                            <thead><tr><th>ID</th><th>Name</th></tr></thead>
                            <tbody>{documents.map(item =>
                                <tr key={item._id}>
                                    <td><button value={item._id} onClick={ e  => this.selectDoc(e, item._id)}>{item._id}</button></td>
                                    <td>{item.name}</td>
                                </tr>)
                            }</tbody>
                        </Table>
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
