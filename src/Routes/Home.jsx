import React, { Component } from "react";
import { Button, Container, Col, Row } from "react-bootstrap";
import welcomeImg from "../img/welcome.svg";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import "../styles/login.scss";
import { getUsername, logout } from "../utils/auth.js";

export default class Home extends Component {
    test() {
        return this.props.location.state;
    }
    
    render() {
        return (
            <>
                <Header
                    showUser={true}
                    username={getUsername(this.props.location.state)}
                    logout={logout}
                />

                <main className="home">
                    {this.props.location.state}
                    <Container className="mt-5">
                        <Row>
                            <Col lg={4} md={6} sm={12} className="mt-5 p-3 text-center">
                                <div className="mt-5 pb-4">
                                    <img src="logo.png" alt="logo" />
                                    <h1 className="logotitle">AuroDocs™</h1>
                                </div>
                                <h2 className="text-black-50 mt-4 mb-4">home!</h2>
                                <h5 className="text-black-50">Start by logging in...</h5>
                                <div className="d-grid gap-2">
                                    <Button className="mt-2" size="lg" href="#login" variant="primary">
                                        Go to Login
                                    </Button>
                                </div>
                            </Col>
                            <Col lg={8} md={6} sm={12}>
                                <img className="w-100" src={welcomeImg} alt="background art" />
                            </Col>
                        </Row>
                    </Container>
                </main>

                <Footer />
            </>
        );
    }
}
