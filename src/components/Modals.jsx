import React, { Component } from "react";
import { Modal, Button, InputGroup, FormControl, Dropdown, ButtonGroup, ToggleButton } from "react-bootstrap";

export default class Modals extends Component {
    constructor(props) {
        super(props);
        this.state = {
            newModalShown: false,
            newDocName: null,
            newDocType: "text",
        };
    }

    hideNewModal = () => {
        this.setState({ newModalShown: false });
    };

    showNewModal = () => {
        this.setState({ newModalShown: true });
    };

    docTypes = [
        { name: "Text", value: "text" },
        { name: "Code", value: "code" },
    ];

    render() {
        return (
            <>
                {this.props.modal === "new" ? (
                    // handleUsersInput
                    // createDocument(newDocName, newDocType, e)
                    <Modal show={this.props.show} onHide={this.hideNewModal}>
                        <Modal.Header closeButton>
                            <Modal.Title>Create New Document</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <InputGroup size="lg">
                                <InputGroup.Text id="inputGroup-sizing-lg">Name</InputGroup.Text>
                                <FormControl
                                    aria-label="Large"
                                    aria-describedby="inputGroup-sizing-sm"
                                    onChange={(e) => this.props.handleName(e.target.value)}
                                />
                            </InputGroup>
                            <Dropdown.Divider />
                            <InputGroup>
                                <InputGroup.Text>Other users (comma separated)</InputGroup.Text>
                                <FormControl
                                    as="textarea"
                                    aria-label="Other users (comma separated)"
                                    onChange={(e) => this.props.handleUsers(e.target.value)}
                                />
                            </InputGroup>
                            <br />
                            <h6 style={{ display: "inline" }}>Document Type: </h6>
                            <ButtonGroup>
                                {this.docTypes.map((radio, idx) => (
                                    <ToggleButton
                                        key={idx}
                                        id={`radio-${idx}`}
                                        type="radio"
                                        variant={idx % 2 ? "outline-success" : "outline-primary"}
                                        name="radio"
                                        value={radio.value}
                                        checked={this.props.radioValue === radio.value}
                                        onChange={(e) => this.props.handleRadio(e.currentTarget.value)}
                                    >
                                        {radio.name}
                                    </ToggleButton>
                                ))}
                            </ButtonGroup>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button
                                variant="primary"
                                onClick={(e) => {
                                    this.props.createDocument(this.state.newDocName, this.state.newDocType, e);
                                    this.hideNewModal();
                                }}
                            >
                                Save
                            </Button>
                            <Button variant="secondary" onClick={this.hideNewModal}>
                                Close
                            </Button>
                        </Modal.Footer>
                    </Modal>
                ) : null}
            </>
        );
    }
}
