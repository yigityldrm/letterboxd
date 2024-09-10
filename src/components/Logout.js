// src/Logout.js
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const handleLogout = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/logout/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    },
                    body: JSON.stringify({ refresh: localStorage.getItem('refresh_token') }),
                });

                if (response.ok) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    navigate('/login');
                } else {
                    setError('Logout failed. Please try again.');
                }
            } catch (error) {
                setError('Something went wrong. Please try again later.');
            }
        };

        handleLogout();
    }, [navigate]);

    return (
        <Container>
            <Row className="justify-content-md-center mt-5">
                <Col md={6}>
                    <h2 className="text-center mb-4">Logging Out...</h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                </Col>
            </Row>
        </Container>
    );
};

export default Logout;
