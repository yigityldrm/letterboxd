import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Alert, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true); // Add loading state
    const navigate = useNavigate();

    useEffect(() => {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            navigate('/login');
            return;
        }

        const fetchUsers = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/userlist/', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });

                if (response.status === 401) {
                    // If status is 401 Unauthorized, redirect to the login page
                    navigate('/login');
                } else if (response.ok) {
                    const data = await response.json();
                    setUsers(data);
                } else {
                    setError('Failed to load users.');
                }
            } catch (error) {
                setError('Something went wrong. Please try again later.');
            } finally {
                setLoading(false); // Set loading to false once done
            }
        };

        fetchUsers();
    }, [navigate]);

    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    return (
        <Container>
            <Row className="justify-content-md-center mt-5">
                <Col md={12}>
                    <h2 className="text-center mb-4">User List</h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Username</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? (
                                users.map((user, index) => (
                                    <tr key={index}>
                                        <td>{user.email}</td>
                                        <td>{user.username}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="2" className="text-center">No users found</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                    <Button
                        variant="danger"
                        onClick={() => navigate('/logout')}
                        className="mt-4"
                    >
                        Logout
                    </Button>
                </Col>
            </Row>
        </Container>
    );
};

export default UserList;
