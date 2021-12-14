import React, { Component } from "react";

import { ToastContainer, Toast } from "react-bootstrap";

export default class Notification extends Component {
    render() {
        return (
            <ToastContainer position="top-end" className="p-3">
                <Toast onClose={this.props.toastClose} show={this.props.toastShow} delay={4000} autohide>
                    <Toast.Header>
                        <strong className="me-auto">Notice</strong>
                        <small className="text-muted">just now</small>
                    </Toast.Header>
                    <Toast.Body>{this.props.content}</Toast.Body>
                </Toast>
            </ToastContainer>
        );
    }
}
