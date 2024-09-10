import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Table, Alert, Spinner, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const AdminMovieSearchPage = () => {
    const [query, setQuery] = useState('');
    const [movies, setMovies] = useState([]);
    const [movieData, setMovieData] = useState({
        tmdb_id: '',
        title: '',
        release_date: '',
        vote_average: '',
        overview: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    const handleSearch = async () => {
        if (!query) {
            setError('Please enter a search term.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/admin/movies/?query=${query}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
            });

            if (response.status === 401) {
                navigate('/login');
                return;
            }

            const data = await response.json();
            if (response.ok) {
                setMovies(data);
            } else {
                setError(data.error || 'Failed to fetch movies.');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMovie = (tmdb_id) => {
        const selected = movies.find(movie => movie.id === tmdb_id);
        if (selected) {
            setMovieData({
                tmdb_id: selected.id,
                title: selected.title,
                release_date: selected.release_date,
                vote_average: selected.vote_average,
                overview: selected.overview || ''
            });
            setShowModal(true);
        }
    };

    const handleResubmitMovie = async () => {
        setAdding(true);
        setError('');

        console.log('Submitting movieData:', movieData); // Debugging statement

        try {
            const response = await fetch('http://127.0.0.1:8000/api/admin/movies/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(movieData),
            });

            const data = await response.json();
            if (response.ok) {
                console.log('Movie added successfully:', data); // Debugging statement
                alert('Movie added successfully!');
                handleSearch(); // Refresh the list of movies
                setMovieData({
                    tmdb_id: '',
                    title: '',
                    release_date: '',
                    vote_average: '',
                    overview: ''
                }); // Clear movie data
                setShowModal(false); // Close modal
                
            } else {
                console.error('Failed to add movie:', data); // Debugging statement
                setError(data.error || 'Failed to add movie.');
            }
        } catch (err) {
            console.error('Error during movie addition:', err); // Debugging statement
            setError('Something went wrong. Please try again.');
        } finally {
            setAdding(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setMovieData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-md-center">
                <Col md={8}>
                    <h2 className="text-center">Admin Movie Search</h2>
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
                        <Form.Group className="mb-3" controlId="formMovieSearch">
                            <Form.Label>Search Movies</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter movie title"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </Form.Group>

                        <Button variant="primary" onClick={handleSearch} disabled={loading}>
                            {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Search'}
                        </Button>
                    </Form>

                    {movies.length > 0 && (
                        <Table striped bordered hover className="mt-4">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Release Date</th>
                                    <th>Vote Average</th>
                                    <th>Add to Database</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movies.map((movie) => (
                                    <tr key={movie.id}>
                                        <td>{movie.title}</td>
                                        <td>{movie.release_date}</td>
                                        <td>{movie.vote_average}</td>
                                        <td>
                                            <Button
                                                variant="success"
                                                onClick={() => handleAddMovie(movie.id)}
                                                disabled={adding}
                                            >
                                                {adding ? <Spinner as="span" animation="border" size="sm" /> : 'Add'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}

                    {/* Modal for editing movie details */}
                    <Modal show={showModal} onHide={() => setShowModal(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Edit Movie Details</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Title</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="title"
                                        value={movieData.title}
                                        onChange={handleChange}
                                        
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Release Date</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="release_date"
                                        value={movieData.release_date}
                                        onChange={handleChange}
                                        
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Vote Average</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="vote_average"
                                        value={movieData.vote_average}
                                        onChange={handleChange}
                                        
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Overview</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        name="overview"
                                        value={movieData.overview}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Form>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowModal(false)}>
                                Close
                            </Button>
                            <Button variant="primary" onClick={handleResubmitMovie} disabled={adding}>
                                {adding ? <Spinner as="span" animation="border" size="sm" /> : 'Save Changes'}
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </Col>
            </Row>
        </Container>
    );
};

export default AdminMovieSearchPage;
