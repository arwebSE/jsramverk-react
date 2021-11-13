import { useState } from 'react'
import { Col, Container, Row, Form, Button, Alert } from 'react-bootstrap';
import registerImg from '../img/register.svg';
import { Formik } from 'formik';
import * as yup from 'yup';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import '../styles/login.scss';

let apiUrl;
if (process.env.NODE_ENV === "development") {
    console.log("=> Dev Mode!");
    apiUrl = "http://localhost:1337";
} else {
    apiUrl = "https://jsramverk-editor-auro17.azurewebsites.net";
    //apiUrl = "https://jsramverk-api.arwebse.repl.co";
}

export default function Register() {
    const [errors, setError] = useState({ status: 0, message: '', error: 0 });
    const [messages, setMessages] = useState('');
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);

    const schema = yup.object().shape({
        username: yup.string().required('Username is required'),
        password: yup.string().required('Password is required')
    });

    function submit(values) {
        console.log("Submitted values:", values);
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: values.username, password: values.password })
        };
        fetch(`${apiUrl}/register`, requestOptions)
            .then(async response => {
                const isJson = response.headers.get('content-type')?.includes('application/json');
                const data = isJson && await response.json();
                console.log("data", data);

                // If error
                if (!response.ok) {
                    // get error message from body or default to response status
                    const error = (data && data.message) || response.status;
                    const newError = { status: data.status, message: data.message, error: data.error }
                    setError(newError);
                    setShowErrorAlert(true);
                    return Promise.reject(error);
                }

                // If success
                console.log("Successful registration! data:", data);
                setMessages(data);
                setShowSuccessAlert(true);
                window.location.href = "#success";
            })
            .catch((error) => {
                console.error('Error logging in!', error);
            });
    }

    return (
        <>
            <Header />

            <Alert variant="danger" show={showErrorAlert} onClose={() => setShowErrorAlert(false)} dismissible>
                {errors.message}
            </Alert>

            <Alert variant="success" show={showSuccessAlert} onClose={() => setShowSuccessAlert(false)} dismissible>
                {messages}
            </Alert>

            <main className="register">
                <Container className="mt-5">
                    <Row>
                        <Col lg={4} md={6} sm={12} className="mt-5 p-3">
                            <div className="text-center">
                                <img width="100" src="logo.png" alt="logo" />
                                <h2 className="logotitle mb-5">AuroDocs™</h2>
                            </div>

                            <Formik
                                validationSchema={schema}
                                onSubmit={(values) => submit(values)}
                                initialValues={{ username: '', password: '' }}
                            >
                                {({ handleSubmit, handleChange, values, touched, errors }) => (
                                    <Form noValidate onSubmit={handleSubmit}>
                                        <h5 className="text-start mb-4 text-black-50">Register New Account</h5>

                                        <Form.Group className="mb-3 relative" controlId="registerUsername">
                                            <Form.Label>Username</Form.Label>
                                            <Form.Control required type="text" placeholder="New Username" name="username"
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
                                            <Form.Control required type="password" placeholder="New Password" name="password"
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
                                            <Button variant="primary" type="submit" size="lg">Sign Up</Button>
                                        </div>

                                        <div className="mt-2 text-center">
                                            <a href="#login" className="reset"><small>Already have an account?</small></a>
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        </Col>

                        <Col lg={8} md={6} sm={12}>
                            <img className="w-100" src={registerImg} alt="background art" />
                        </Col>
                    </Row>
                </Container>
            </main>

            <Footer />
        </>
    )
}
