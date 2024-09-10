import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie'; // Token'ı çerezden almak için
import { Container, Form, Button, Alert } from 'react-bootstrap';

const AddMovie = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Token'ı çerezden al
      const token = Cookies.get('myapp_auth_cookie');

      if (!token) {
        setError('You need to be logged in to add a movie.');
        return;
      }

      // POST isteği ile filmi ekle
      const response = await axios.post(
        'http://127.0.0.1:8000/api/movies/',
        { title, description },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Token'ı Authorization header'ında gönder
          },
        }
      );

      // Başarılı olduğunda mesaj göster
      setSuccess('Movie added successfully!');
      setTitle('');
      setDescription('');
    } catch (err) {
      setError('Failed to add movie. Please try again.');
      console.error('Add movie error:', err);
    }
  };

  return (
    <Container className="my-5">
      <h2 className="mb-4">Add New Movie</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </Form.Group>
        <Button variant="primary" type="submit" disabled={!title || !description}>
          Add Movie
        </Button>
      </Form>
    </Container>
  );
};

export default AddMovie;
