import { Col, Container, Row, Form, Button, Navbar } from 'react-bootstrap';
import '../styles/login.scss';
import { FaGithub } from 'react-icons/fa';
import registerImg from '../img/register.svg';
import { Formik } from 'formik';
import * as yup from 'yup';
import { useHistory } from "react-router";


export default function Register() {
    const schema = yup.object().shape({
        username: yup.string().required('Username is required'),
        password: yup.string().required('Password is required')
    });

    const history = useHistory();

    function submit() {
        console.log("hej?");
        history.push({ pathname: "/success" });
    }

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
                        
                        <Formik
                            validationSchema={schema}
                            onSubmit={submit}
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

                                    <div className="mt-2">
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
        </>
    )
}
