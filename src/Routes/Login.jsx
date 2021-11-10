import React, { Component } from 'react'
import { Col, Container, Row, Form, Button, Navbar } from 'react-bootstrap';
import { FaGithub } from 'react-icons/fa';
import '../styles/login.scss';
import loginImg from '../img/login.svg';

export default class Login extends Component {
    render() {
        return (
            <>
                <Navbar bg="dark" variant="dark" className="toolbar">
                    <Container>
                        <Navbar.Brand href="#" className="justify-content-center">
                            <img src="logo.png" width="30" height="30"
                                className="d-inline-block align-top" alt="AuroDocs logo"
                            /> AuroDocs™
                        </Navbar.Brand>
                        <Navbar.Toggle aria-controls="basic-navbar-nav" />
                        <div className="justify-content-end">
                            <Button variant="success" href="https://github.com/arwebSE/jsramverk-react">GitHub <FaGithub /></Button>
                        </div>
                    </Container>
                </Navbar>

                <Container className="mt-5">
                    <Row>
                        <Col lg={4} md={6} sm={12} className="mt-5 p-3">
                            <div className="text-center">
                                <img src="logo.png" alt="logo" />
                                <h1 className="logotitle mb-5">AuroDocs™</h1>
                            </div>

                            <Form>
                                <h5 className="text-start mb-4 text-black-50">Login To Your Account</h5>
                                <Form.Group className="mb-3" controlId="loginUsername">
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control type="text" placeholder="Enter your username" />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="loginPassword">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control type="password" placeholder="Enter your password" />
                                </Form.Group>
                                <div className="d-grid gap-2">
                                    <Button variant="primary" type="submit" size="lg">Login</Button>
                                </div>

                                <div className="mt-2">
                                    <a href="#register" className="reset"><small>Don't have an account?</small></a>
                                    <div></div>
                                    {/* eslint-disable jsx-a11y/anchor-is-valid */}
                                    <a href="#" className="reset"><small>Forgotten password?</small></a>
                                </div>
                            </Form>
                        </Col>

                        <Col lg={8} md={6} sm={12}>
                            <img className="w-100" src={loginImg} alt="background art" />
                        </Col>
                    </Row>
                </Container>
            </>
        )
    }
}
