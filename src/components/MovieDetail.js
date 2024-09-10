import React, { useEffect, useState } from 'react';
import { Button, Modal, Form, Alert, Card, Container, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useParams, useNavigate } from 'react-router-dom';

const MovieDetailPage = () => {
  const { tmdbId } = useParams(); 
  const [movie, setMovie] = useState(null);
  
  const [editTitle, setEditTitle] = useState('');
  const [editOverview, setEditOverview] = useState('');
  const [editVoteAverage, setEditVoteAverage] = useState('');
  const [editPosterPath, setEditPosterPath] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [reviews, setReviews] = useState([]); // Initialize as an empty array
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [likeError, setLikeError] = useState('');
  const navigate = useNavigate();
  const accessToken = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchMovie = async () => {
      if (!accessToken) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`http://127.0.0.1:8000/api/movies/${tmdbId}/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 401) {
          navigate('/login');
        } else if (response.ok) {
          const data = await response.json();
          setMovie(data);
          console.log('Fetched movie:', data); 
          setEditTitle(data.title);
          setEditOverview(data.overview);
          setEditVoteAverage(data.vote_average);
          setEditPosterPath(data.poster_path);

          // Check if the current user is a superuser
          const userResponse = await fetch('http://127.0.0.1:8000/api/token/users/me/', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            setIsSuperUser(userData.is_superuser);
          }

          // Fetch reviews
          const reviewResponse = await fetch(`http://127.0.0.1:8000/api/movies/${tmdbId}/reviews/`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (reviewResponse.ok) {
            const reviewData = await reviewResponse.json();
            console.log('Fetched reviews:', reviewData); 
            // Ensure reviewData is an array
            if (Array.isArray(reviewData)) {
              setReviews(reviewData);
            } else {
              setError('Unexpected review data format.');
            }
          }

          setError('');
        } else {
          setError('Failed to load movie details.');
        }
      } catch (error) {
        setError('Something went wrong. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [tmdbId, navigate, accessToken]);

  const handleSaveChanges = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/movies/${tmdbId}/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tmdb_id: movie.tmdb_id,
          title: editTitle.trim(),
          overview: editOverview.trim(),
          vote_average: editVoteAverage,
          poster_path: editPosterPath,
        }),
      });

      if (response.ok) {
        const updatedMovie = await response.json();
        setMovie(updatedMovie);
        setIsModalOpen(false);
      } else {
        setError('Failed to update movie. Please try again.');
      }
    } catch (error) {
      setError('Something went wrong. Please try again later.');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/movies/${tmdbId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        setDeleteSuccess('Movie deleted successfully.');
        setMovie(null);
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      } else {
        setError('Failed to delete movie.');
      }
    } catch (error) {
      setError('Something went wrong. Please try again later.');
    }
  };

  const handleAddReview = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/movies/${tmdbId}/reviews/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movie: movie.id, // Use movie's pk here
          text: newReview.trim(), // Field expected by the API
        }),
      });

      if (response.ok) {
        const newReviewData = await response.json();
        setReviews([...reviews, newReviewData]);
        setNewReview('');
      } else {
        const errorData = await response.json();
        setReviewError(errorData.text[0] || 'Failed to add review.');
      }
    } catch (error) {
      setReviewError('Something went wrong. Please try again later.');
    }
  };

  const handleRateMovie = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/movies/${tmdbId}/ratings/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movie: movie.id, // Use movie's pk here
          rating: newRating, // Field expected by the API
        }),
      });

      if (response.ok) {
        const updatedMovie = await response.json();
        setMovie(updatedMovie); // Ensure the updated movie data is set correctly
        setNewRating('');
      } else {
        const errorData = await response.json();
        setRatingError(errorData.rating[0] || 'Failed to rate movie.');
      }
    } catch (error) {
      setRatingError('Something went wrong. Please try again later.');
    }
  };

  const handleLikeReview = async (reviewId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/movies/${tmdbId}/reviews/${reviewId}/like/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const updatedReviews = reviews.map(review =>
          review.id === reviewId ? { ...review, likes: review.likes + 1 } : review
        );
        setReviews(updatedReviews);
      } else {
        setLikeError('Failed to like review.');
      }
    } catch (error) {
      setLikeError('Something went wrong. Please try again later.');
    }
  };

  const handleUnlikeReview = async (reviewId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/movies/${tmdbId}/reviews/${reviewId}/unlike/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const updatedReviews = reviews.map(review =>
          review.id === reviewId ? { ...review, likes: review.likes - 1 } : review
        );
        setReviews(updatedReviews);
      } else {
        setLikeError('Failed to unlike review.');
      }
    } catch (error) {
      setLikeError('Something went wrong. Please try again later.');
    }
  };

  if (loading) {
    return <div className="alert alert-info">Loading...</div>;
  }

  return (
    <Container>
      {error && <Alert variant="danger">{error}</Alert>}
      {deleteSuccess && <Alert variant="success">{deleteSuccess}</Alert>}
      {reviewError && <Alert variant="danger">{reviewError}</Alert>}
      {ratingError && <Alert variant="danger">{ratingError}</Alert>}
      {likeError && <Alert variant="danger">{likeError}</Alert>}
      {movie ? (
        <>
          <Card>
            <Row>
              <Col md={4}>
                <Card.Img variant="top" src={movie.poster_path} />
              </Col>
              <Col md={8}>
                <Card.Body>
                  <Card.Title>{movie.title}</Card.Title>
                  <Card.Text>{movie.overview}</Card.Text>
                  <Card.Text>
                    <strong>Vote Average: {movie.vote_average}</strong>
                  </Card.Text>
                  {isSuperUser && (
                    <div>
                      <Button variant="primary" onClick={() => setIsModalOpen(true)}>Edit</Button>
                      <Button variant="danger" onClick={handleDelete} className="ms-2">Delete</Button>
                    </div>
                  )}
                </Card.Body>
              </Col>
            </Row>
          </Card>
          <div>
            <h2>Reviews</h2>
            <Form>
              <Form.Group controlId="review">
                <Form.Label>Add a Review</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                />
              </Form.Group>
              <Button variant="primary" onClick={handleAddReview}>Submit Review</Button>
            </Form>
            <ul>
              {Array.isArray(reviews) && reviews.map(review => (
                <li key={review.id}>
                  <p>{review.text}</p>
                  <p>Likes: {review.likes}</p>
                  <Button onClick={() => handleLikeReview(review.id)}>Like</Button>
                  <Button onClick={() => handleUnlikeReview(review.id)}>Unlike</Button>
                </li>
              ))}
            </ul>
          </div>
          <Form>
            <Form.Group controlId="rating">
              <Form.Label>Rate this Movie</Form.Label>
              <Form.Control
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={newRating}
                onChange={(e) => setNewRating(e.target.value)}
              />
            </Form.Group>
            <Button variant="primary" onClick={handleRateMovie}>Submit Rating</Button>
          </Form>
          <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Edit Movie</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group controlId="editTitle">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </Form.Group>
                <Form.Group controlId="editOverview">
                  <Form.Label>Overview</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={editOverview}
                    onChange={(e) => setEditOverview(e.target.value)}
                  />
                </Form.Group>
                <Form.Group controlId="editVoteAverage">
                  <Form.Label>Vote Average</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={editVoteAverage}
                    onChange={(e) => setEditVoteAverage(e.target.value)}
                  />
                </Form.Group>
                <Form.Group controlId="editPosterPath">
                  <Form.Label>Poster Path</Form.Label>
                  <Form.Control
                    type="text"
                    value={editPosterPath}
                    onChange={(e) => setEditPosterPath(e.target.value)}
                  />
                </Form.Group>
                <Button variant="primary" onClick={handleSaveChanges}>Save Changes</Button>
              </Form>
            </Modal.Body>
          </Modal>
        </>
      ) : (
        !deleteSuccess && <p>No movie details available.</p>
      )}
    </Container>
  );
};

export default MovieDetailPage;
