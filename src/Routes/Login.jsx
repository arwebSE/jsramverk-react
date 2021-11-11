import React from 'react'
import { Col, Container, Row, Form, Button, Alert } from 'react-bootstrap';
import '../styles/login.scss';
import loginImg from '../img/login.svg';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import { Formik } from 'formik';
import * as yup from 'yup';

export default class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            alertShown: false,
            alertContent: null
        };
    }

    schema = yup.object().shape({
        username: yup.string().required('Username is required'),
        password: yup.string().required('Password is required')
    });

    submit(values) {
        console.log("Submitted values:", values);
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: values.username, password: values.password })
        };
        fetch('http://localhost:1337/login', requestOptions)
            .then(async response => {
                const isJson = response.headers.get('content-type')?.includes('application/json');
                const data = isJson && await response.json();

                // check for error response
                if (!response.ok) {
                    // get error message from body or default to response status
                    const error = (data && data.message) || response.status;
                    this.showAlert(data);
                    return Promise.reject(error);
                }
                console.log("Got accessToken:", data.accessToken, "refreshToken:", data.refreshToken);
                //this.setState({ accessToken: data.accessToken, refreshToken: data.refreshToken })
            })
            .catch(error => {
                console.error('Error logging in!', error);
            });
    }

    showAlert = (content) => { this.setState({ alertShown: true, alertContent: content }) }
    hideAlert = () => { this.setState({ alertShown: false, alertContent: null }) }

    render() {
        return (
            <>
                <Header />

                <Alert variant="danger" show={this.state.errorAlertShown} onClose={this.hideAlert} dismissible>
                    {this.state.alertContent}
                </Alert>


                <main className="login">
                    <Container className="mt-5">
                        <Row>
                            <Col lg={4} md={6} sm={12} className="mt-5 p-3">
                                <div className="text-center">
                                    <img width="100" src="logo.png" alt="logo" />
                                    <h2 className="logotitle mb-5">AuroDocs™</h2>
                                </div>

                                <Formik
                                    validationSchema={this.schema}
                                    onSubmit={(values) => this.submit(values)}
                                    onChange={e => this.handleChange(e)}
                                    initialValues={{ username: '', password: '' }}
                                >
                                    {({ handleSubmit, handleChange, values, touched, errors }) => (
                                        <Form noValidate onSubmit={handleSubmit}>
                                            <h5 className="text-start mb-4 text-black-50">Login To Your Account</h5>

                                            <Form.Group className="mb-3 relative" controlId="registerUsername">
                                                <Form.Label>Username</Form.Label>
                                                <Form.Control required type="text" placeholder="Enter your username" name="username"
                                                    onChange={handleChange}
                                                    value={values.username}
                                                    isInvalid={!!errors.username}
                                                    isValid={touched.username && !errors.username}
                                                />
                                                <Form.Control.Feedback tooltip type="valid">Looks good!</Form.Control.Feedback>
                                                <Form.Control.Feedback tooltip type="invalid">
                                                    {errors.username}
                                                </Form.Control.Feedback>
                                            </Form.Group>

                                            <Form.Group className="mb-3 relative" controlId="registerPassword">
                                                <Form.Label>Password</Form.Label>
                                                <Form.Control required type="password" placeholder="Enter your password" name="password"
                                                    onChange={handleChange}
                                                    value={values.password}
                                                    isInvalid={!!errors.password}
                                                    isValid={touched.password && !errors.password}
                                                />
                                                <Form.Control.Feedback tooltip type="valid">Looks good!</Form.Control.Feedback>
                                                <Form.Control.Feedback tooltip type="invalid">
                                                    {errors.password}
                                                </Form.Control.Feedback>
                                            </Form.Group>

                                            <div className="d-grid gap-2">
                                                <Button variant="primary" type="submit" size="lg">Login</Button>
                                            </div>

                                            <div className="mt-2 text-center">
                                                <a href="#register" className="reset"><small>Don't have an account?</small></a>
                                                <div></div>
                                                {/* eslint-disable jsx-a11y/anchor-is-valid */}
                                                <a href="#" className="reset"><small>Forgotten password?</small></a>
                                            </div>
                                        </Form>
                                    )}
                                </Formik>
                            </Col>

                            <Col lg={8} md={6} sm={12}>
                                <img className="w-100" src={loginImg} alt="background art" />
                            </Col>
                        </Row>
                    </Container>
                </main>

                <Footer />
            </>
        )
    }
}
